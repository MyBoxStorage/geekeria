import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CreditCard, User, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { createPayment } from '@/services/mercadopago';
import { MERCADOPAGO_CONFIG, generateExternalReference } from '@/config/mercadopago.config';
import { toast } from 'sonner';

// Schema de validação do formulário
const checkoutSchema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  zipCode: z.string().min(8, 'CEP inválido'),
  address: z.string().min(5, 'Endereço inválido'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix']),
  installments: z.number().min(1).max(12),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentId: number) => void;
}

export function Checkout({ isOpen, onClose, onSuccess }: CheckoutProps) {
  const { cart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
      installments: 1,
    },
  });

  const paymentMethod = watch('paymentMethod');

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (cart.items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    setIsProcessing(true);

    try {
      // Para pagamento com cartão, você precisará do token do cartão
      // Por enquanto, vamos criar um pagamento básico
      // Em produção, você precisará integrar o Mercado Pago Checkout Pro ou usar o SDK
      
      // Gera referência externa única
      const externalReference = generateExternalReference();

      const paymentData = {
        transaction_amount: cart.total,
        description: `Pedido BRAVOS BRASIL - ${cart.items.length} item(ns)`,
        installments: data.installments,
        payment_method_id: paymentMethod === 'credit_card' ? 'visa' : paymentMethod === 'debit_card' ? 'master' : 'pix',
        payer: {
          email: data.email,
        },
        items: cart.items,
        payerEmail: data.email,
        payerName: data.name,
        payerPhone: data.phone,
        payerZipCode: data.zipCode,
        payerAddress: data.address,
        // Campos recomendados pela checklist de qualidade
        statementDescriptor: MERCADOPAGO_CONFIG.STATEMENT_DESCRIPTOR,
        externalReference: externalReference,
        notificationUrl: MERCADOPAGO_CONFIG.WEBHOOK_URL || undefined,
        backUrls: MERCADOPAGO_CONFIG.BACK_URLS,
        binaryMode: MERCADOPAGO_CONFIG.PAYMENT.binaryMode,
        maxInstallments: MERCADOPAGO_CONFIG.PAYMENT.maxInstallments,
        shipmentAmount: cart.shipping > 0 ? cart.shipping : undefined,
      };

      const payment = await createPayment(paymentData);

      toast.success('Pagamento processado com sucesso!');
      
      // Limpar carrinho após sucesso
      clearCart();
      
      // Fechar checkout
      onClose();
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(payment.id);
      }

      // Redirecionar ou mostrar informações do pagamento
      if (payment.status === 'approved') {
        toast.success(`Pagamento aprovado! ID: ${payment.id}`);
      } else if (payment.status === 'pending') {
        toast.info('Pagamento pendente. Aguardando confirmação.');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao processar pagamento. Tente novamente.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#00843D]">
            FINALIZAR COMPRA
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para concluir seu pedido
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Método de Pagamento */}
          <div className="space-y-4">
            <h3 className="font-display text-lg text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              FORMA DE PAGAMENTO
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="credit_card"
                  value="credit_card"
                  {...register('paymentMethod')}
                  className="w-4 h-4"
                />
                <Label htmlFor="credit_card" className="cursor-pointer">
                  Cartão de Crédito
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="debit_card"
                  value="debit_card"
                  {...register('paymentMethod')}
                  className="w-4 h-4"
                />
                <Label htmlFor="debit_card" className="cursor-pointer">
                  Cartão de Débito
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="pix"
                  value="pix"
                  {...register('paymentMethod')}
                  className="w-4 h-4"
                />
                <Label htmlFor="pix" className="cursor-pointer">
                  PIX (5% de desconto)
                </Label>
              </div>
            </div>

            {paymentMethod !== 'pix' && (
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <select
                  id="installments"
                  {...register('installments', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      {num}x {formatPrice(cart.total / num)} sem juros
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatPrice(cart.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Frete</span>
              <span>{cart.shipping === 0 ? 'Grátis' : formatPrice(cart.shipping)}</span>
            </div>
            <div className="flex justify-between font-display text-xl text-[#00843D] pt-2 border-t">
              <span>TOTAL</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00843D] hover:bg-[#006633] text-white font-display"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'CONFIRMAR PAGAMENTO'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
