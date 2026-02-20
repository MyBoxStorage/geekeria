/**
 * Checkout usando Payment Brick do Mercado Pago React SDK
 * 
 * Este componente usa APENAS o SDK React oficial do Mercado Pago.
 * Não faz chamadas diretas à API - todo processamento é feito pelo Brick.
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { apiConfig } from '@/config/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, AlertCircle, Loader2, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { PaymentBrick } from '@/components/PaymentBrick';
import { toast } from 'sonner';
import { createOrder, type CreateOrderResponse } from '@/services/checkout';
import {
  loadPendingCheckout,
  savePendingCheckout,
  clearPendingCheckout,
  writeLegacyPendingKey,
  type PendingCheckoutV1,
} from '@/utils/pendingCheckout';

// ─── Schema de validação premium (PT-BR) ──────────────────────────────────
const checkoutSchema = z.object({
  name: z
    .string()
    .min(3, 'Informe seu nome completo')
    .refine(
      (v) => v.trim().split(/\s+/).length >= 2,
      'Informe nome e sobrenome',
    ),
  email: z.string().email('Informe um e-mail válido'),
  phone: z
    .string()
    .min(1, 'Informe seu telefone')
    .refine(
      (v) => v.replace(/\D/g, '').length >= 10,
      'Telefone deve ter pelo menos 10 dígitos',
    ),
  zipCode: z
    .string()
    .min(1, 'Informe o CEP')
    .refine(
      (v) => v.replace(/\D/g, '').length === 8,
      'CEP deve ter exatamente 8 dígitos',
    ),
  address: z.string().min(5, 'Informe o endereço completo'),
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
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [isBrickLoading, setIsBrickLoading] = useState(true);

  // ── Pending checkout recovery state ──────────────────────────────────────
  const [pendingRecovery, setPendingRecovery] = useState<PendingCheckoutV1 | null>(null);

  // Detectar pending checkout válido sempre que o dialog abrir (e estiver na etapa do form)
  useEffect(() => {
    if (isOpen && !showPaymentBrick) {
      const pending = loadPendingCheckout();
      if (
        pending &&
        pending.orderId &&
        pending.externalReference &&
        pending.totals &&
        pending.step === 'payment'
      ) {
        setPendingRecovery(pending);
      } else {
        setPendingRecovery(null);
      }
    }
  }, [isOpen, showPaymentBrick]);

  /** Continuar pagamento de pedido pendente */
  const handleContinuePayment = useCallback(() => {
    if (
      !pendingRecovery ||
      !pendingRecovery.orderId ||
      !pendingRecovery.externalReference ||
      !pendingRecovery.totals
    ) return;

    setOrderData({
      orderId: pendingRecovery.orderId,
      externalReference: pendingRecovery.externalReference,
      totals: pendingRecovery.totals,
    });

    if (pendingRecovery.payer) {
      setCustomerData({
        name: pendingRecovery.payer.name,
        email: pendingRecovery.payer.email,
        phone: pendingRecovery.payer.phone ?? '',
        zipCode: pendingRecovery.payer.zipCode ?? '',
        address: pendingRecovery.payer.address ?? '',
      });
    }

    setShowPaymentBrick(true);
    setPendingRecovery(null);
    toast.success('Pedido recuperado! Continue com o pagamento.');
  }, [pendingRecovery]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  /** Reiniciar checkout (descarta pedido pendente e reseta formulário) */
  const handleRestartCheckout = useCallback(() => {
    clearPendingCheckout();
    setPendingRecovery(null);
    setOrderData(null);
    setCustomerData(null);
    setShowPaymentBrick(false);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponType(null);
    reset();
  }, [reset]);

  /** Apenas dispensar o banner de pendência, sem resetar formulário */
  const handleDismissPending = useCallback(() => {
    clearPendingCheckout();
    setPendingRecovery(null);
  }, []);

  if (import.meta.env.DEV) {
    console.log('CheckoutWithBrick - Renderizado');
    console.log('CheckoutWithBrick - isOpen:', isOpen);
    console.log('CheckoutWithBrick - showPaymentBrick:', showPaymentBrick);
    console.log('CheckoutWithBrick - customerData:', customerData);
    console.log('CheckoutWithBrick - cart.total:', cart.total);
    console.log('MercadoPago Public Key:', import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
  }

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

  const getCouponDiscount = (): number => {
    if (couponDiscount === 0 || !couponType) return 0;
    if (couponType === 'FREE_SHIPPING') return 0; // frete tratado separado
    if (couponType === 'PERCENTAGE') return (subtotalFromCart * couponDiscount) / 100;
    return Math.min(couponDiscount, subtotalFromCart);
  };

  const shippingCost =
    couponType === 'FREE_SHIPPING' ? 0 : (orderData?.totals?.shippingCost ?? cart.shipping);

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
        data.coupon.type === 'FREE_SHIPPING'
          ? '✅ Cupom aplicado! Frete grátis'
          : data.coupon.type === 'PERCENTAGE'
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

  /** Traduz erros do create-order em mensagens amigáveis PT-BR */
  const translateCreateOrderError = (err: unknown): string => {
    if (!err || typeof err !== 'object') {
      return 'Erro ao criar pedido. Tente novamente.';
    }

    const apiErr = err as {
      kind?: string;
      status?: number;
      error?: string;
      message?: string;
      details?: Array<{ color?: string; size?: string; productId?: string }>;
    };

    if (apiErr.kind === 'network') {
      return 'Não conseguimos finalizar agora. Verifique sua conexão e tente novamente.';
    }

    if (apiErr.kind === 'http') {
      if (apiErr.status && apiErr.status >= 500) {
        return 'Não conseguimos finalizar agora. Tente novamente em instantes.';
      }

      switch (apiErr.error) {
        case 'OUT_OF_STOCK_VARIANT': {
          let msg =
            'Essa combinação de cor e tamanho não está disponível. Ajuste a seleção e tente novamente.';
          if (Array.isArray(apiErr.details) && apiErr.details.length > 0) {
            const first = apiErr.details[0];
            if (first?.color && first?.size) {
              msg += ` Ex.: ${first.color} / ${first.size}`;
            }
          }
          return msg;
        }
        case 'PRODUCT_NOT_FOUND':
          return 'Um item do seu carrinho não está mais disponível. Atualize o carrinho.';
        default:
          return apiErr.message || 'Erro ao criar pedido. Tente novamente.';
      }
    }

    const fallbackMsg = (err as { message?: string }).message;
    return typeof fallbackMsg === 'string' && fallbackMsg
      ? fallbackMsg
      : 'Erro ao criar pedido. Tente novamente.';
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

    // ── Anti-duplicação: reutilizar pedido pendente válido ──────────────
    const existingPending = loadPendingCheckout();
    if (
      existingPending &&
      existingPending.orderId &&
      existingPending.externalReference &&
      existingPending.totals &&
      existingPending.step === 'payment'
    ) {
      if (import.meta.env.DEV) {
        console.log('CheckoutWithBrick - Pedido pendente detectado, pulando create-order');
      }

      setOrderData({
        orderId: existingPending.orderId,
        externalReference: existingPending.externalReference,
        totals: existingPending.totals,
      });
      setCustomerData(data);
      setShowPaymentBrick(true);
      setPendingRecovery(null);
      toast.success('Pedido anterior recuperado! Continue com o pagamento.');
      return;
    }

    // ── Salvar step="form" antes de chamar create-order ────────────────
    const cartItems = cart.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
      size: item.size,
      color: item.color,
    }));

    savePendingCheckout({
      orderId: null,
      externalReference: null,
      payer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        zipCode: data.zipCode,
        address: data.address,
      },
      items: cartItems,
      totals: null,
      step: 'form',
    });

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
        },
        items: cartItems,
        couponCode:
          couponDiscount > 0 || couponType === 'FREE_SHIPPING'
            ? couponCode.trim().toUpperCase()
            : undefined,
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

      // ── Atualizar pending com orderId + step="payment" ───────────────
      savePendingCheckout({
        orderId: orderResponse.orderId,
        externalReference: orderResponse.externalReference,
        payer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          zipCode: data.zipCode,
          address: data.address,
        },
        items: cartItems,
        totals: orderResponse.totals,
        step: 'payment',
      });

      // Escrever key legada para compat com CheckoutPending/CheckoutSuccess
      writeLegacyPendingKey(orderResponse.orderId, orderResponse.externalReference, data.email);

      // Mostrar PaymentBrick
      setShowPaymentBrick(true);
      setIsCreatingOrder(false);
      
      toast.success('Pedido criado! Continue com o pagamento.');
    } catch (error: unknown) {
      console.error('CheckoutWithBrick - Erro ao criar pedido:', error);
      setIsCreatingOrder(false);
      
      // Limpar pending form (não salvar half-state com falha)
      clearPendingCheckout();
      
      toast.error(translateCreateOrderError(error));
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
            ...(data.formData?.device_id && { device_id: data.formData.device_id }),
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

          // Limpar carrinho, pending state e fechar modal
          clearPendingCheckout();
          clearCart();
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

          // Limpar carrinho, pending state e fechar modal
          clearPendingCheckout();
          clearCart();
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
    setIsBrickLoading(false);
    if (import.meta.env.DEV) console.log('Payment Brick está pronto');
  };

  const handleBackToForm = () => {
    setShowPaymentBrick(false);
    setCustomerData(null);
    setIsBrickLoading(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#7C3AED]">
            FINALIZAR COMPRA
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1 text-sm">
            <span
              className={`font-display tracking-wide ${!showPaymentBrick ? 'text-[#7C3AED]' : 'text-gray-400'}`}
            >
              ETAPA 1 · Seus dados
            </span>
            <span className="text-gray-300">→</span>
            <span
              className={`font-display tracking-wide ${showPaymentBrick ? 'text-[#7C3AED]' : 'text-gray-400'}`}
            >
              ETAPA 2 · Pagamento
            </span>
          </DialogDescription>
        </DialogHeader>

        {!showPaymentBrick ? (
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <fieldset disabled={isCreatingOrder} className="space-y-6">
            {/* ── Painel de recuperação de checkout pendente ─────────────── */}
            {pendingRecovery && (
              <div className="rounded-xl border border-amber-300 bg-gradient-to-b from-amber-50 to-white p-5 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-2 shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display text-base text-amber-900 tracking-wide">
                      PAGAMENTO PENDENTE DETECTADO
                    </h4>
                    <p className="text-sm text-amber-700 font-body leading-relaxed">
                      Encontramos uma tentativa de pagamento recente.
                      Você pode continuar de onde parou ou reiniciar.
                    </p>
                  </div>
                </div>

                {/* Detalhes do pedido pendente (quando disponíveis) */}
                {(pendingRecovery.externalReference || pendingRecovery.totals) && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-amber-800 font-body pl-12">
                    {pendingRecovery.externalReference && (
                      <span>Ref.: <strong>{pendingRecovery.externalReference}</strong></span>
                    )}
                    {pendingRecovery.totals?.total != null && (
                      <span>
                        Total:{' '}
                        <strong>
                          {pendingRecovery.totals.total.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleContinuePayment}
                    className="flex-1 bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display"
                  >
                    CONTINUAR PAGAMENTO
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRestartCheckout}
                    className="flex-1 font-display"
                  >
                    REINICIAR CHECKOUT
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={handleDismissPending}
                  className="w-full text-center text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2 font-body transition-colors"
                >
                  Remover pendência e preencher do zero
                </button>
              </div>
            )}

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
              {(couponDiscount > 0 || couponType === 'FREE_SHIPPING') && (
                <p className="text-green-600 text-sm mt-2">
                  ✅ Cupom &quot;{couponCode}&quot; aplicado:{' '}
                  {couponType === 'FREE_SHIPPING'
                    ? 'Frete grátis'
                    : couponType === 'PERCENTAGE'
                      ? `${couponDiscount}%`
                      : `R$ ${couponDiscount.toFixed(2)}`}{' '}
                  {couponType !== 'FREE_SHIPPING' && 'de desconto'}
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
              {getCouponDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto ({couponCode})</span>
                  <span>- {formatPrice(getCouponDiscount())}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Frete</span>
                <span>
                  {shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-display text-xl text-[#7C3AED] pt-2 border-t">
                <span>TOTAL</span>
                <span>
                  {formatPrice(
                    orderData?.totals?.total ??
                      Math.max(
                        0,
                        cart.subtotal - cart.discount - getCouponDiscount() + shippingCost
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
                className="flex-1 bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display disabled:opacity-50"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    CRIANDO PEDIDO...
                  </>
                ) : (
                  'CONTINUAR PARA PAGAMENTO'
                )}
              </Button>
            </div>
            </fieldset>
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
                    <h3 className="font-semibold text-green-900 mb-2">Dados confirmados</h3>
                    <p className="text-sm text-green-700">
                      <strong>Cliente:</strong> {customerData.name} ({customerData.email})
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Total:</strong> {formatPrice(orderData.totals.total)}
                    </p>
                  </div>

                  {/* Badge de segurança */}
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-800">
                      Pagamento seguro via Mercado Pago
                    </p>
                  </div>

                  {/* Loading indicator do Brick */}
                  {isBrickLoading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Carregando opções de pagamento...</span>
                    </div>
                  )}

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
