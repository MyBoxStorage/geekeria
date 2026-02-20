/**
 * Payment Brick - Mercado Pago React SDK
 * 
 * Componente oficial do Mercado Pago para processamento de pagamentos.
 * Suporta múltiplos métodos de pagamento: cartão, PIX, boleto, etc.
 * 
 * Documentação: https://github.com/mercadopago/sdk-react
 * MCP: mercadopago-mcp-server (quality_checklist, search_documentation)
 */

import { Payment } from '@mercadopago/sdk-react';
import { useMemo } from 'react';
import { apiConfig } from '@/config/api';
import type { CartItem } from '@/types';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PaymentBrickProps {
  amount: number;
  items: CartItem[];
  payerEmail: string;
  payerName?: string;
  externalReference: string; // OBRIGATÓRIO: External reference do pedido criado no backend
  onReady?: () => void;
  onSubmit?: (formData: any) => Promise<unknown>;
  onError?: (error: any) => void;
}

export function PaymentBrick({
  amount,
  items,
  payerEmail,
  payerName,
  externalReference,
  onReady,
  onSubmit,
  onError,
}: PaymentBrickProps) {
  if (import.meta.env.DEV) {
    console.log('PaymentBrick - Componente renderizado');
    console.log('PaymentBrick - Props:', { amount, itemsCount: items.length, payerEmail, payerName, externalReference });
  }

  // Validação: externalReference é OBRIGATÓRIO
  // Não gerar fallback - deve vir do Order criado no backend
  if (!externalReference || externalReference.trim() === '') {
    console.error('PaymentBrick - ERRO: externalReference é obrigatório e não foi fornecido');
    toast.error('Erro: não foi possível iniciar o pagamento. Recarregue o checkout.');
    
    return (
      <div className="w-full min-h-[400px] py-4 flex items-center justify-center">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <p className="font-semibold mb-2">Erro ao iniciar pagamento</p>
            <p className="text-sm mb-4">
              Não foi possível iniciar o pagamento. Por favor, recarregue a página e tente novamente.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Recarregar Página
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Prepara os dados de inicialização do Payment Brick
  // Usando useMemo para evitar recriações desnecessárias
  const initialization = useMemo(() => {
    if (import.meta.env.DEV) {
      console.log('PaymentBrick - Criando initialization object');
      console.log('PaymentBrick - Usando externalReference do pedido:', externalReference);
    }

    const webhookUrl = apiConfig.baseURL ? `${apiConfig.baseURL}/api/mp/webhooks` : undefined;

    return {
      amount: Number(amount),
      payer: {
        email: payerEmail,
        ...(payerName && {
          first_name: payerName.split(' ')[0] || payerName,
          last_name: payerName.split(' ').slice(1).join(' ') || '',
        }),
      },
      items: items.map((item) => ({
        id: item.product.id,
        title: `${item.product.name} - ${item.size} - ${item.color}`,
        description: item.product.description,
        picture_url: (item.product.image ?? '').startsWith('/')
          ? `${window.location.origin}${item.product.image}`
          : (item.product.image ?? ''),
        category_id: item.product.category,
        quantity: item.quantity,
        unit_price: item.product.price,
      })),
      external_reference: externalReference,
      statement_descriptor: 'GEEKERIA',
      back_urls: {
        success: `${window.location.origin}/checkout/success`,
        failure: `${window.location.origin}/checkout/failure`,
        pending: `${window.location.origin}/checkout/pending`,
      },
      notification_url: webhookUrl ?? import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL ?? undefined,
    };
  }, [amount, items, payerEmail, payerName, externalReference]);

  if (import.meta.env.DEV) {
    console.log('PaymentBrick - Initialization:', initialization);
    console.log('PaymentBrick - Renderizando componente Payment do Mercado Pago');
    console.log('PaymentBrick - Dentro do return, renderizando Payment');
  }

  return (
    <div 
      id="payment-brick-container" 
      className="w-full min-h-[400px] py-4"
      style={{ minHeight: '400px' }}
    >
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💳 Selecione seu método de pagamento abaixo
        </p>
      </div>
      <Payment
        initialization={initialization as any}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all',
            bankTransfer: ['pix'],
          },
          visual: {
            style: {
              theme: 'default',
            },
          },
        }}
        onSubmit={async (formData: any) => {
          if (import.meta.env.DEV) console.log('PaymentBrick - onSubmit chamado com dados:', formData);

          // Se houver callback customizado, chama primeiro
          // O callback pode fazer o redirecionamento
          if (onSubmit) {
            try {
              await onSubmit(formData);
            } catch (error) {
              console.error('PaymentBrick - Erro no callback onSubmit:', error);
            }
          } else {
            if (import.meta.env.DEV) console.log('PaymentBrick - Nenhum callback onSubmit, usando redirecionamento padrão');

            if (formData?.status === 'approved') {
              if (import.meta.env.DEV) console.log('✅ PaymentBrick - Pagamento aprovado, redirecionando...');
              const successUrl = `${window.location.origin}/checkout/success?payment_id=${formData.id}&status=approved&external_reference=${formData.external_reference || ''}`;
              window.location.href = successUrl;
            } else             if (formData?.status === 'pending') {
              if (import.meta.env.DEV) console.log('⏳ PaymentBrick - Pagamento pendente, redirecionando...');
              const paymentMethod = formData.payment_method_id || formData.payment_type_id || 'pix';
              const pendingUrl = `${window.location.origin}/checkout/pending?order_id=${encodeURIComponent(formData.external_reference || '')}&payment_id=${formData.id}&external_reference=${encodeURIComponent(formData.external_reference || '')}&payment_type_id=${paymentMethod}`;
              window.location.href = pendingUrl;
            } else if (formData?.status === 'rejected' || formData?.status === 'cancelled') {
              if (import.meta.env.DEV) console.log('❌ PaymentBrick - Pagamento rejeitado, redirecionando...');
              const failureUrl = `${window.location.origin}/checkout/failure?payment_id=${formData.id}&status=${formData.status}&status_detail=${formData.status_detail || ''}`;
              window.location.href = failureUrl;
            }
          }

          return Promise.resolve();
        }}
        onReady={() => {
          if (import.meta.env.DEV) {
            console.log('✅ PaymentBrick - onReady chamado - Brick está pronto!');
            console.log('✅ PaymentBrick - Métodos de pagamento devem estar visíveis agora');
          }
          onReady?.();
        }}
        onError={(error) => {
          console.error('❌ PaymentBrick - onError chamado:', error);
          onError?.(error);
        }}
      />
      <div className="mt-4 p-3 bg-elevated border border-rim rounded-lg">
        <p className="text-xs text-gray-600">
          💡 Se os métodos de pagamento não aparecerem, verifique o console do navegador (F12) para mais informações.
        </p>
      </div>
    </div>
  );
}
