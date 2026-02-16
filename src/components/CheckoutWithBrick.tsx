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
}

export function CheckoutWithBrick({ isOpen, onClose }: CheckoutWithBrickProps) {
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
      console.log('🚀 PAYMENT BRICK - handlePaymentSubmit CHAMADO');
      console.log('📦 DATA COMPLETO:', JSON.stringify(data, null, 2));

      const paymentType = data.paymentType;
      const paymentMethodId = data.formData?.payment_method_id || data.selectedPaymentMethod || '';

      const isCreditCard = paymentType === 'credit_card';
      const isDebitCard = paymentType === 'debit_card';
      const isCard = isCreditCard || isDebitCard;
      const isPix = paymentType === 'bank_transfer' || paymentMethodId === 'pix';

      console.table({
        'Payment Type': paymentType,
        'Payment Method': paymentMethodId,
        'É Crédito': isCreditCard,
        'É Débito': isDebitCard,
        'É PIX': isPix,
      });

      if (!orderData || !customerData) {
        toast.error('Erro: dados do pedido não encontrados');
        return;
      }

      // ============================================
      // CARTÃO DE CRÉDITO / DÉBITO
      // ============================================
      if (isCard) {
        const cardType = isCreditCard ? 'CRÉDITO' : 'DÉBITO';
        console.log(`💳 Processando CARTÃO DE ${cardType}`);

        try {
          const cardPaymentPayload = {
            token: data.formData.token,
            payment_method_id: data.formData.payment_method_id,
            issuer_id: data.formData.issuer_id,
            installments: isDebitCard ? 1 : (data.formData.installments || 1),
            transaction_amount: orderData.totals.total,
            payer: {
              email: data.formData.payer?.email || customerData.email,
              ...(data.formData.payer?.identification && {
                identification: {
                  type: data.formData.payer.identification.type,
                  number: data.formData.payer.identification.number,
                },
              }),
            },
            external_reference: orderData.externalReference,
          };

          console.log('📤 Enviando para /api/mp/process-card-payment:', cardPaymentPayload);

          const paymentResponse = await fetch(`${apiConfig.baseURL}/api/mp/process-card-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(cardPaymentPayload),
          });

          const result = await paymentResponse.json();
          console.log('📦 Resposta do backend:', result);

          if (!paymentResponse.ok) {
            console.error(`❌ Erro ao processar cartão (${cardType}):`, result);
            const userMessage = getCardErrorMessage(result.status_detail || result.status);
            toast.error(userMessage);
            return;
          }

          // Limpar carrinho e fechar modal
          clearCart();
          localStorage.removeItem('bb_order_pending');
          onClose();
          reset();
          setShowPaymentBrick(false);
          setCustomerData(null);
          setOrderData(null);

          // Redirecionar baseado no status
          if (result.is_approved) {
            console.log(`✅ Pagamento ${cardType} aprovado:`, result.payment_id);
            toast.success('Pagamento aprovado!');
            window.location.href = `/checkout/success?payment_id=${result.payment_id}&external_reference=${result.external_reference}&status=approved`;
          } else if (result.is_pending) {
            console.log(`⏳ Pagamento ${cardType} pendente:`, result.payment_id);
            toast.info('Pagamento em processamento...');
            window.location.href = `/checkout/pending?payment_id=${result.payment_id}&external_reference=${result.external_reference}&payment_type_id=${paymentMethodId}`;
          } else {
            console.error(`❌ Pagamento ${cardType} rejeitado:`, result);
            const userMessage = getCardErrorMessage(result.status_detail);
            toast.error(userMessage);
          }

        } catch (error) {
          console.error(`❌ Erro ao processar cartão:`, error);
          toast.error('Erro ao processar pagamento com cartão. Tente novamente.');
        }

        return;
      }

      // ============================================
      // PIX
      // ============================================
      if (isPix) {
        console.log('🔵 Criando pagamento PIX no backend...');
        
        try {
          const paymentPayload = {
            items: cart.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.product.price,
              size: item.size,
              color: item.color,
            })),
            payer: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
            },
            amount: orderData.totals.total,
            paymentMethod: 'pix',
            // Reutilizar pedido existente (criado em create-order) para evitar duplicação
            existingOrderId: orderData.orderId,
            existingExternalReference: orderData.externalReference,
          };

          console.log('📤 Enviando para /api/mp/create-payment (reusing order):', paymentPayload);

          const paymentResponse = await fetch(`${apiConfig.baseURL}/api/mp/create-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(paymentPayload),
          });

          if (!paymentResponse.ok) {
            const errorData = await paymentResponse.json();
            console.error('❌ Erro ao criar pagamento:', errorData);
            toast.error(errorData.message || 'Erro ao criar pagamento PIX');
            return;
          }

          const paymentData = await paymentResponse.json();
          console.log('✅ Pagamento PIX criado:', paymentData);

          // Salvar dados do PIX no localStorage
          if (paymentData.pix) {
            const pixPaymentData = {
              qrCode: paymentData.pix.copyPaste,
              qrCodeBase64: paymentData.pix.qrCode,
              paymentId: paymentData.paymentId,
              externalReference: orderData.externalReference,
              timestamp: Date.now(),
            };
            localStorage.setItem('pixPaymentData', JSON.stringify(pixPaymentData));
            console.log('💾 Dados PIX salvos no localStorage:', pixPaymentData);
          }

          // NÃO chamar update-payment separadamente!
          // O create-payment já atualizou o pedido existente com mpPaymentId.
          // Isso evita a duplicação de mpPaymentId que causava o bug do webhook ignorado.

          // Limpar carrinho e fechar modal
          clearCart();
          localStorage.removeItem('bb_order_pending');
          onClose();
          reset();
          setShowPaymentBrick(false);
          setCustomerData(null);
          setOrderData(null);

          // Redirecionar para pending com dados corretos do pedido original
          const redirectUrl = `/checkout/pending?order_id=${orderData.orderId}&payment_id=${paymentData.paymentId}&external_reference=${encodeURIComponent(orderData.externalReference)}&payment_type_id=pix`;
          
          console.log('🔀 Redirecionando para:', redirectUrl);
          toast.success('Pagamento PIX processado! Aguardando confirmação.');
          window.location.href = redirectUrl;

        } catch (error) {
          console.error('❌ Erro ao processar pagamento PIX:', error);
          toast.error('Erro ao processar pagamento. Tente novamente.');
          return;
        }

        return;
      }

      // ============================================
      // MÉTODO NÃO SUPORTADO
      // ============================================
      console.error('⚠️ Método de pagamento não suportado:', paymentType, paymentMethodId);
      toast.error('Método de pagamento não suportado. Use cartão ou PIX.');

    } catch (error) {
      console.error('❌ Erro geral em handlePaymentSubmit:', error);
      toast.error('Erro ao processar pagamento.');
    }
  };

  /**
   * Traduz status_detail do Mercado Pago em mensagem amigável para o usuário
   */
  const getCardErrorMessage = (statusDetail?: string): string => {
    const messages: Record<string, string> = {
      cc_rejected_bad_filled_card_number: 'Número do cartão incorreto. Verifique e tente novamente.',
      cc_rejected_bad_filled_date: 'Data de validade incorreta. Verifique e tente novamente.',
      cc_rejected_bad_filled_other: 'Dados do cartão incorretos. Verifique e tente novamente.',
      cc_rejected_bad_filled_security_code: 'Código de segurança incorreto. Verifique e tente novamente.',
      cc_rejected_blacklist: 'Pagamento não autorizado. Entre em contato com seu banco.',
      cc_rejected_call_for_authorize: 'Pagamento requer autorização. Ligue para o seu banco e autorize.',
      cc_rejected_card_disabled: 'Cartão desabilitado. Entre em contato com seu banco para ativar.',
      cc_rejected_card_error: 'Erro no cartão. Tente com outro cartão.',
      cc_rejected_duplicated_payment: 'Pagamento duplicado. Aguarde ou tente com outro cartão.',
      cc_rejected_high_risk: 'Pagamento recusado por segurança. Tente com outro cartão.',
      cc_rejected_insufficient_amount: 'Saldo insuficiente. Tente com outro cartão ou método de pagamento.',
      cc_rejected_invalid_installments: 'Número de parcelas inválido para este cartão.',
      cc_rejected_max_attempts: 'Limite de tentativas excedido. Tente com outro cartão.',
      cc_rejected_other_reason: 'Pagamento não aprovado. Tente com outro cartão.',
      rejected: 'Pagamento não aprovado. Tente outro método de pagamento.',
      pending: 'Pagamento em processamento. Aguarde a confirmação.',
      in_process: 'Pagamento em análise. Aguarde a confirmação.',
    };

    return messages[statusDetail || ''] || 'Pagamento não aprovado. Verifique os dados e tente novamente.';
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
              <div className={`flex justify-between text-sm ${cart.items.some((i) => i.product.category === 'TESTES') ? 'text-green-600' : ''}`}>
                <span>Frete</span>
                <span>
                  {(orderData?.totals.shippingCost ?? cart.shipping) === 0
                    ? (cart.items.some((i) => i.product.category === 'TESTES') ? 'GRÁTIS (Produto de Teste)' : 'Grátis')
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
                        cart.subtotal - cart.discount - calculateCouponDiscount() + cart.shipping
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
