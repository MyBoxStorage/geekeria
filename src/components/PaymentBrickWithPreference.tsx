/**
 * Payment Brick com Preferência - Mercado Pago React SDK
 * 
 * Versão que usa preferências de pagamento criadas no backend
 * Mais seguro e recomendado para produção
 */

import { Payment } from '@mercadopago/sdk-react';
import { useEffect, useState } from 'react';
import type { CartItem } from '@/types';
import { createPreference, type CreatePreferenceRequest } from '@/services/mercadopago-preference';
import { toast } from 'sonner';

interface PaymentBrickWithPreferenceProps {
  amount: number;
  items: CartItem[];
  payerEmail: string;
  payerName?: string;
  payerPhone?: string;
  payerZipCode?: string;
  payerAddress?: string;
  shipping?: number;
  onReady?: () => void;
  onSubmit?: (formData: any) => Promise<unknown>;
  onError?: (error: any) => void;
}

export function PaymentBrickWithPreference({
  amount,
  items,
  payerEmail,
  payerName,
  payerPhone,
  payerZipCode,
  payerAddress,
  shipping,
  onReady,
  onSubmit,
  onError,
}: PaymentBrickWithPreferenceProps) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (import.meta.env.DEV) {
    console.log('PaymentBrickWithPreference - Componente renderizado');
    console.log('PaymentBrickWithPreference - Props:', { 
      amount, 
      itemsCount: items.length, 
      payerEmail, 
      payerName 
    });
  }

  // Criar preferência quando o componente montar
  useEffect(() => {
    const createPreferenceAsync = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (import.meta.env.DEV) console.log('PaymentBrickWithPreference - Criando preferência...');

        const preferenceData: CreatePreferenceRequest = {
          items,
          payer: {
            name: payerName || 'Cliente',
            email: payerEmail,
            phone: payerPhone,
            zipCode: payerZipCode,
            address: payerAddress,
          },
          amount,
          shipping,
        };

        const result = await createPreference(preferenceData);

        if (import.meta.env.DEV) console.log('✅ PaymentBrickWithPreference - Preferência criada:', result.preferenceId);
        setPreferenceId(result.preferenceId);
        setIsLoading(false);
      } catch (err) {
        console.error('❌ PaymentBrickWithPreference - Erro ao criar preferência:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar preferência de pagamento';
        setError(errorMessage);
        setIsLoading(false);
        toast.error(errorMessage);
        onError?.(err);
      }
    };

    createPreferenceAsync();
  }, [amount, items, payerEmail, payerName, payerPhone, payerZipCode, payerAddress, shipping, onError]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Criando preferência de pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center py-8">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <p className="text-red-800 font-semibold mb-2">Erro ao carregar pagamento</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!preferenceId) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Preferência não encontrada</p>
        </div>
      </div>
    );
  }

  if (import.meta.env.DEV) console.log('PaymentBrickWithPreference - Renderizando Payment com preferenceId:', preferenceId);

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
        initialization={{
          amount: amount,
          preferenceId: preferenceId,
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all',
            bankTransfer: ['pix'],
          },
        }}
        onSubmit={onSubmit || (async () => Promise.resolve())}
        onReady={() => {
          if (import.meta.env.DEV) {
            console.log('✅ PaymentBrickWithPreference - onReady chamado - Brick está pronto!');
            console.log('✅ PaymentBrickWithPreference - Métodos de pagamento devem estar visíveis agora');
          }
          onReady?.();
        }}
        onError={(error) => {
          console.error('❌ PaymentBrickWithPreference - onError chamado:', error);
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
