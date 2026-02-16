/**
 * Checkout usando Payment Brick do Mercado Pago React SDK
 * 
 * Este componente usa APENAS o SDK React oficial do Mercado Pago.
 * Não faz chamadas diretas à API - todo processamento é feito pelo Brick.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiConfig } from '@/config/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { PaymentBrick } from '@/components/PaymentBrick';
import { toast } from 'sonner';
import { createOrder, type CreateOrderResponse } from '@/services/checkout';

// Schema de validação do formulário
const checkoutSchema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  zipCode: z.string().min(8, 'CEP inválido'),
  address: z.string().min(5, 'Endereço inválido'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutWithBrickProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentId: string) => void;
}

export function CheckoutWithBrick({ isOpen, onClose, onSuccess }: CheckoutWithBrickProps) {
  const { cart, clearCart } = useCart();
  const { token } = useAuth();
  const [showPaymentBrick, setShowPaymentBrick] = useState(false);
  const [customerData, setCustomerData] = useState<CheckoutFormData | null>(null);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED' | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (import.meta.env.DEV) {
    console.log('CheckoutWithBrick - Renderizado');
    console.log('CheckoutWithBrick - isOpen:', isOpen);
    console.log('CheckoutWithBrick - showPaymentBrick:', showPaymentBrick);
    console.log('CheckoutWithBrick - customerData:', customerData);
    console.log('CheckoutWithBrick - cart.total:', cart.total);
    console.log('MercadoPago Public Key:', import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const subtotalFromCart = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const calculateCouponDiscount = (): number => {
    if (couponDiscount === 0 || !couponType) return 0;
    if (couponType === 'PERCENTAGE') {
      return (subtotalFromCart * couponDiscount) / 100;
    }
    return Math.min(couponDiscount, subtotalFromCart);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    setValidatingCoupon(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiConfig.baseURL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Cupom inválido');
        setCouponDiscount(0);
        setCouponType(null);
        return;
      }

      setCouponDiscount(data.coupon.value);
      setCouponType(data.coupon.type);
      toast.success(
        data.coupon.type === 'PERCENTAGE'
          ? `✅ Cupom aplicado! ${data.coupon.value}% de desconto`
          : `✅ Cupom aplicado! R$ ${data.coupon.value.toFixed(2)} de desconto`
      );
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Erro ao validar cupom');
      setCouponDiscount(0);
      setCouponType(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  /**
   * Parseia o endereço completo em componentes separados
   * Formato esperado: "Rua, número, complemento" ou similar
   * Tenta extrair número, mas se não conseguir, envia o endereço completo
   */
  const parseAddress = (address: string) => {
    if (!address) return {};
    
    // Tenta extrair número do endereço (padrão comum: "Rua X, 123" ou "Rua X 123" ou "Rua X, 123 - Apto 101")
    // Procura por padrões como ", 123", " 123", ",123", etc.
    const numberMatch = address.match(/(?:,\s*|\s+)(\d+[A-Za-z]?)(?:\s*[-,\s]|$)/);
    const number = numberMatch ? numberMatch[1] : undefined;
    
    // Se encontrou número, tenta separar rua e complemento
    if (number) {
      const parts = address.split(new RegExp(`\\b${number}\\b`));
      const address1 = parts[0]?.trim().replace(/,$/, '') || address;
      const complement = parts[1]?.trim().replace(/^[-,\s]+/, '') || undefined;
      
      return {
        address1: address1 || undefined,
        number: number,
        complement: complement,
      };
    }
    
    // Se não encontrou número, envia o endereço completo como address1
    return {
      address1: address,
    };
  };

  const onFormSubmit = async (data: CheckoutFormData) => {
    if (import.meta.env.DEV) {
      console.log('CheckoutWithBrick - onFormSubmit chamado');
      console.log('CheckoutWithBrick - Form data:', data);
    }
    
    if (cart.items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      // Parsear endereço
      const parsedAddress = parseAddress(data.address);
      
      // Montar payload para o backend
      const orderPayload = {
        payer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        shipping: {
          cep: data.zipCode,
          address1: parsedAddress.address1,
          number: parsedAddress.number,
          complement: parsedAddress.complement,
          // Campos adicionais (district, city, state) podem ser adicionados no futuro
        },
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          size: item.size,
          color: item.color,
        })),
        couponCode: couponDiscount > 0 ? couponCode.trim().toUpperCase() : undefined,
      };

      if (import.meta.env.DEV) console.log('CheckoutWithBrick - Criando pedido no backend...', orderPayload);

      // Criar pedido no backend
      const orderResponse = await createOrder(orderPayload, {
        token: token ?? localStorage.getItem('token') ?? undefined,
      });
      
      if (import.meta.env.DEV) console.log('CheckoutWithBrick - Pedido criado:', orderResponse);

      // Salvar dados do pedido
      setOrderData(orderResponse);
      setCustomerData(data);
      
      // Salvar no localStorage para persistência
      localStorage.setItem('bb_order_pending', JSON.stringify({
        orderId: orderResponse.orderId,
        externalReference: orderResponse.externalReference,
        email: data.email,
        timestamp: Date.now(),
      }));

      // Mostrar PaymentBrick
      setShowPaymentBrick(true);
      setIsCreatingOrder(false);
      
      toast.success('Pedido criado! Continue com o pagamento.');
    } catch (error: any) {
      console.error('CheckoutWithBrick - Erro ao criar pedido:', error);
      setIsCreatingOrder(false);
      
      const errorMessage = error?.message || error?.error || 'Erro ao criar pedido. Tente novamente.';
      toast.error(errorMessage);
      
      // Não prosseguir para o pagamento se falhar
      return;
    }
  };

  const handlePaymentSubmit = async (data: any) => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔵 CheckoutWithBrick - Payment processed:', data);
        console.log('🔵 CheckoutWithBrick - Data structure:', {
          paymentType: data.paymentType,
          selectedPaymentMethod: data.selectedPaymentMethod,
          formData: data.formData,
          status: data.status,
          id: data.id,
          external_reference: data.external_reference,
        });
      }

      // Extrair informações do pagamento
      const paymentMethod = data.formData?.payment_method_id || 
                           data.selectedPaymentMethod || 
                           data.payment_method_id || 
                           'unknown';
      
      const paymentId = data.id || 
                       data.formData?.id || 
                       data.payment_id || 
                       `BRAVOS-${Date.now()}`;
      
      const externalReference = data.external_reference || 
                               data.formData?.external_reference || 
                               `BRAVOS-${Date.now()}`;
      
      const status = data.status || 
                    data.formData?.status || 
                    'pending';
      
      const statusDetail = data.status_detail || 
                          data.formData?.status_detail || 
                          '';

      if (import.meta.env.DEV) {
        console.log('🔵 CheckoutWithBrick - Extracted data:', {
          paymentMethod,
          paymentId,
          externalReference,
          status,
          statusDetail,
        });
      }

      // Determinar para qual página redirecionar
      let redirectUrl = '';
      
      // PIX sempre é pendente (bank_transfer)
      if (paymentMethod === 'pix' || 
          data.paymentType === 'bank_transfer' || 
          data.selectedPaymentMethod === 'bank_transfer') {
        if (import.meta.env.DEV) console.log('💳 CheckoutWithBrick - PIX detectado, redirecionando para pending');
        
        // Capturar dados do PIX se disponíveis
        const pixData = data.point_of_interaction?.transaction_data || 
                       data.formData?.point_of_interaction?.transaction_data ||
                       null;
        
        if (pixData) {
          // Salvar dados do PIX no localStorage para usar na página pending
          const pixPaymentData = {
            qrCode: pixData.qr_code,
            qrCodeBase64: pixData.qr_code_base64,
            ticketUrl: pixData.ticket_url,
            paymentId: paymentId,
            externalReference: externalReference,
            timestamp: Date.now(),
          };
          
          localStorage.setItem('pixPaymentData', JSON.stringify(pixPaymentData));
          if (import.meta.env.DEV) console.log('💾 CheckoutWithBrick - Dados do PIX salvos no localStorage:', pixPaymentData);
        } else {
          if (import.meta.env.DEV) {
            console.warn('⚠️ CheckoutWithBrick - PIX detectado mas dados do QR Code não encontrados');
            console.log('⚠️ CheckoutWithBrick - Estrutura completa dos dados:', JSON.stringify(data, null, 2));
          }
        }
        
        redirectUrl = `/checkout/pending?payment_id=${paymentId}&external_reference=${externalReference}&payment_type_id=pix`;
        toast.success('Pagamento PIX processado! Aguardando confirmação.');
      } 
      // Cartão aprovado
      else if (status === 'approved') {
        if (import.meta.env.DEV) console.log('✅ CheckoutWithBrick - Pagamento aprovado, redirecionando para success');
        redirectUrl = `/checkout/success?payment_id=${paymentId}&external_reference=${externalReference}`;
        toast.success('Pagamento aprovado com sucesso!');
      } 
      // Cartão recusado
      else if (status === 'rejected' || status === 'cancelled') {
        if (import.meta.env.DEV) console.log('❌ CheckoutWithBrick - Pagamento recusado, redirecionando para failure');
        redirectUrl = `/checkout/failure?payment_id=${paymentId}&status_detail=${statusDetail || 'generic_error'}`;
        toast.error('Pagamento não foi aprovado.');
      } 
      // Outros casos pendentes (boleto, etc)
      else {
        if (import.meta.env.DEV) console.log('⏳ CheckoutWithBrick - Pagamento pendente, redirecionando para pending');
        redirectUrl = `/checkout/pending?payment_id=${paymentId}&external_reference=${externalReference}&payment_type_id=${paymentMethod}`;
        toast.success('Pagamento processado! Aguardando confirmação.');
      }

      // Limpar carrinho após processar pagamento
      clearCart();
      
      // Limpar dados do pedido pendente do localStorage
      localStorage.removeItem('bb_order_pending');
      
      // Fechar checkout
      onClose();
      
      // Resetar formulário
      reset();
      setShowPaymentBrick(false);
      setCustomerData(null);
      setOrderData(null);

      // Chamar callback de sucesso se fornecido
      if (onSuccess && paymentId) {
        onSuccess(paymentId.toString());
      }

      // Redirecionar usando window.location.href para garantir recarregamento
      if (import.meta.env.DEV) console.log('🔵 CheckoutWithBrick - Redirecionando para:', redirectUrl);
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('❌ CheckoutWithBrick - Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      handlePaymentError(error);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Erro no Payment Brick:', error);
    toast.error(
      error?.message || 'Erro ao processar pagamento. Verifique os dados e tente novamente.'
    );
  };

  const handlePaymentReady = () => {
    if (import.meta.env.DEV) console.log('Payment Brick está pronto');
  };

  const handleBackToForm = () => {
    setShowPaymentBrick(false);
    setCustomerData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#00843D]">
            FINALIZAR COMPRA
          </DialogTitle>
          <DialogDescription>
            {showPaymentBrick
              ? 'Selecione o método de pagamento'
              : 'Preencha os dados para concluir seu pedido'}
          </DialogDescription>
        </DialogHeader>

        {!showPaymentBrick ? (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="font-display text-lg text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                DADOS PESSOAIS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Seu nome completo"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="seu@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="(00) 00000-0000"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-display text-lg text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                ENDEREÇO DE ENTREGA
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    {...register('zipCode')}
                    placeholder="00000-000"
                    className={errors.zipCode ? 'border-red-500' : ''}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.zipCode.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Rua, número, complemento"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cupom de Desconto */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">🎟️ Cupom de Desconto</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código do cupom"
                  className="flex-1"
                  disabled={validatingCoupon}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon}
                >
                  {validatingCoupon ? 'Validando...' : 'Aplicar'}
                </Button>
              </div>
              {couponDiscount > 0 && (
                <p className="text-green-600 text-sm mt-2">
                  ✅ Cupom &quot;{couponCode}&quot; aplicado:{' '}
                  {couponType === 'PERCENTAGE'
                    ? `${couponDiscount}%`
                    : `R$ ${couponDiscount.toFixed(2)}`}{' '}
                  de desconto
                </p>
              )}
            </div>

            {/* Resumo do Pedido */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(orderData?.totals.subtotal ?? cart.subtotal)}</span>
              </div>
              {(orderData?.totals.discountTotal ?? cart.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto (quantidade)</span>
                  <span>-{formatPrice(orderData?.totals.discountTotal ?? cart.discount)}</span>
                </div>
              )}
              {calculateCouponDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto ({couponCode})</span>
                  <span>- {formatPrice(calculateCouponDiscount())}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Frete</span>
                <span>
                  {(orderData?.totals.shippingCost ?? cart.shipping) === 0
                    ? 'Grátis'
                    : formatPrice(orderData?.totals.shippingCost ?? cart.shipping)}
                </span>
              </div>
              <div className="flex justify-between font-display text-xl text-[#00843D] pt-2 border-t">
                <span>TOTAL</span>
                <span>
                  {formatPrice(
                    orderData?.totals.total ??
                      Math.max(
                        0,
                        cart.subtotal -
                          cart.discount -
                          calculateCouponDiscount() +
                          (cart.subtotal - cart.discount - calculateCouponDiscount() > 200
                            ? 0
                            : 15)
                      )
                  )}
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingOrder}
                className="flex-1 bg-[#00843D] hover:bg-[#006633] text-white font-display disabled:opacity-50"
              >
                {isCreatingOrder ? 'Criando pedido...' : 'CONTINUAR PARA PAGAMENTO'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToForm}
              className="mb-4"
            >
              ← Voltar para dados pessoais
            </Button>

            {(() => {
              if (!customerData) {
                console.error('CheckoutWithBrick - ERRO: customerData é null quando showPaymentBrick é true');
                return (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      ⚠️ Erro: Dados do cliente não encontrados. Por favor, volte e preencha o formulário novamente.
                    </p>
                  </div>
                );
              }
              
              // Validação: orderData e externalReference são OBRIGATÓRIOS
              if (!orderData || !orderData.externalReference || orderData.externalReference.trim() === '') {
                console.error('CheckoutWithBrick - ERRO: orderData ou externalReference não encontrados');
                toast.error('Erro: não foi possível iniciar o pagamento. Recarregue o checkout.');
                return (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-semibold mb-2">Erro ao iniciar pagamento</p>
                    <p className="text-red-700 text-sm mb-4">
                      Não foi possível iniciar o pagamento. Por favor, volte e tente novamente.
                    </p>
                    <Button
                      onClick={handleBackToForm}
                      variant="outline"
                      className="w-full"
                    >
                      ← Voltar para dados pessoais
                    </Button>
                  </div>
                );
              }
              
              if (import.meta.env.DEV) {
                console.log('CheckoutWithBrick - Renderizando PaymentBrick com dados:', {
                  amount: orderData.totals.total,
                  itemsCount: cart.items.length,
                  payerEmail: customerData.email,
                  payerName: customerData.name,
                  externalReference: orderData.externalReference,
                });
              }
              
              return (
                <div className="payment-step-container">
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">✅ Dados confirmados</h3>
                    <p className="text-sm text-green-700">
                      <strong>Cliente:</strong> {customerData.name} ({customerData.email})
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Total:</strong> {formatPrice(orderData.totals.total)}
                    </p>
                  </div>
                  <PaymentBrick
                    amount={orderData.totals.total}
                    items={cart.items}
                    payerEmail={customerData.email}
                    payerName={customerData.name}
                    externalReference={orderData.externalReference}
                    onReady={handlePaymentReady}
                    onSubmit={handlePaymentSubmit}
                    onError={handlePaymentError}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
