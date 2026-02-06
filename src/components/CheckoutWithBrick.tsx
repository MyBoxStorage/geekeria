/**
 * Checkout usando Payment Brick do Mercado Pago React SDK
 * 
 * Este componente usa APENAS o SDK React oficial do Mercado Pago.
 * Não faz chamadas diretas à API - todo processamento é feito pelo Brick.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { PaymentBrick } from '@/components/PaymentBrick';
import { toast } from 'sonner';

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
  const [showPaymentBrick, setShowPaymentBrick] = useState(false);
  const [customerData, setCustomerData] = useState<CheckoutFormData | null>(null);

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

  const onFormSubmit = (data: CheckoutFormData) => {
    if (cart.items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    setCustomerData(data);
    setShowPaymentBrick(true);
  };

  const handlePaymentSubmit = async (formData: any) => {
    try {
      // O Payment Brick processa o pagamento automaticamente
      // formData contém os dados do pagamento processado
      console.log('Payment processed:', formData);

      // Verificar status do pagamento
      if (formData?.status === 'approved' || formData?.status === 'pending') {
        toast.success('Pagamento processado com sucesso!');
        
        // Limpar carrinho após sucesso
        clearCart();
        
        // Fechar checkout
        onClose();
        
        // Resetar formulário
        reset();
        setShowPaymentBrick(false);
        setCustomerData(null);

        // Chamar callback de sucesso se fornecido
        if (onSuccess && formData?.id) {
          onSuccess(formData.id.toString());
        }

        // Redirecionar baseado no status
        if (formData?.status === 'approved') {
          // Pagamento aprovado - redirecionar para página de sucesso
          window.location.href = `${window.location.origin}/checkout/success?payment_id=${formData.id}`;
        } else if (formData?.status === 'pending') {
          // Pagamento pendente - redirecionar para página de pendente
          window.location.href = `${window.location.origin}/checkout/pending?payment_id=${formData.id}`;
        }
      } else {
        // Pagamento rejeitado ou com erro
        toast.error('Pagamento não foi aprovado. Verifique os dados e tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Erro no Payment Brick:', error);
    toast.error(
      error?.message || 'Erro ao processar pagamento. Verifique os dados e tente novamente.'
    );
  };

  const handlePaymentReady = () => {
    console.log('Payment Brick está pronto');
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
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#00843D] hover:bg-[#006633] text-white font-display"
              >
                CONTINUAR PARA PAGAMENTO
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

            {customerData && (
              <PaymentBrick
                amount={cart.total}
                items={cart.items}
                payerEmail={customerData.email}
                payerName={customerData.name}
                onReady={handlePaymentReady}
                onSubmit={handlePaymentSubmit}
                onError={handlePaymentError}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
