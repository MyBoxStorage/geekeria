/**
 * Checkout Adaptativo - Web e Mobile
 * 
 * Detecta automaticamente o dispositivo e escolhe a melhor estratégia:
 * - Web: Payment Brick (embedded)
 * - Mobile: Redirecionamento para checkout do Mercado Pago
 */

import { useState, useEffect } from 'react';
import { PaymentBrickWithPreference } from './PaymentBrickWithPreference';
import { createPreference, redirectToCheckout, type CreatePreferenceRequest } from '@/services/mercadopago-preference';
import { getDeviceInfo, shouldUseRedirect } from '@/utils/device-detection';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem } from '@/types';

interface AdaptiveCheckoutProps {
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

export function AdaptiveCheckout({
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
}: AdaptiveCheckoutProps) {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [isCreatingPreference, setIsCreatingPreference] = useState(false);
  const [preferenceCreated, setPreferenceCreated] = useState(false);

  useEffect(() => {
    // Atualizar informações do dispositivo quando necessário
    setDeviceInfo(getDeviceInfo());
  }, []);

  const handleMobileCheckout = async () => {
    try {
      setIsCreatingPreference(true);

      if (import.meta.env.DEV) console.log('AdaptiveCheckout - Criando preferência para mobile...');

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

      if (import.meta.env.DEV) {
        console.log('✅ AdaptiveCheckout - Preferência criada:', result.preferenceId);
        console.log('📱 AdaptiveCheckout - Redirecionando para checkout mobile...');
      }

      // Redirecionar para o checkout do Mercado Pago
      // O Mercado Pago detecta automaticamente o dispositivo e abre no app se disponível
      redirectToCheckout(result.initPoint);
      
      setPreferenceCreated(true);
    } catch (error) {
      console.error('❌ AdaptiveCheckout - Erro ao criar preferência:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar preferência de pagamento';
      toast.error(errorMessage);
      onError?.(error);
      setIsCreatingPreference(false);
    }
  };

  // Se for mobile, mostrar botão de redirecionamento
  if (shouldUseRedirect()) {
    return (
      <div className="w-full space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Checkout Mobile</h3>
          </div>
          <p className="text-sm text-blue-700">
            Você será redirecionado para o checkout do Mercado Pago. 
            Se você tiver o app instalado, ele será aberto automaticamente.
          </p>
        </div>

        {!preferenceCreated ? (
          <Button
            onClick={handleMobileCheckout}
            disabled={isCreatingPreference}
            className="w-full"
            size="lg"
          >
            {isCreatingPreference ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparando checkout...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Ir para o Pagamento
              </>
            )}
          </Button>
        ) : (
          <div className="text-center p-4 bg-elevated rounded-lg">
            <p className="text-sm text-gray-600">
              Redirecionando para o checkout...
            </p>
          </div>
        )}

        <div className="p-3 bg-elevated border border-rim rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Plataforma detectada:</strong> {deviceInfo.platform === 'ios' ? 'iOS' : deviceInfo.platform === 'android' ? 'Android' : 'Web'}
          </p>
        </div>
      </div>
    );
  }

  // Se for web, usar Payment Brick
  return (
    <div className="w-full">
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800 font-medium">Checkout Web</p>
        </div>
        <p className="text-xs text-green-700 mt-1">
          Selecione seu método de pagamento abaixo
        </p>
      </div>
      
      <PaymentBrickWithPreference
        amount={amount}
        items={items}
        payerEmail={payerEmail}
        payerName={payerName}
        payerPhone={payerPhone}
        payerZipCode={payerZipCode}
        payerAddress={payerAddress}
        shipping={shipping}
        onReady={onReady}
        onSubmit={onSubmit}
        onError={onError}
      />
    </div>
  );
}
