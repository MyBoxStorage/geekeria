/**
 * Provider do Mercado Pago React SDK
 * 
 * Este componente inicializa o SDK do Mercado Pago uma única vez
 * na aplicação. O initMercadoPago deve ser chamado apenas uma vez.
 * 
 * Documentação oficial: https://github.com/mercadopago/sdk-react
 */

import { initMercadoPago } from '@mercadopago/sdk-react';
import { useEffect } from 'react';

interface MercadoPagoProviderProps {
  children: React.ReactNode;
}

export function MercadoPagoProvider({ children }: MercadoPagoProviderProps) {
  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    
    if (!publicKey) {
      console.warn(
        'VITE_MERCADOPAGO_PUBLIC_KEY não está configurado. ' +
        'Adicione a Public Key no arquivo .env'
      );
      return;
    }

    try {
      // Inicializa o SDK do Mercado Pago
      // Deve ser chamado apenas uma vez na aplicação
      initMercadoPago(publicKey, {
        locale: 'pt-BR',
      });
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago SDK:', error);
    }
  }, []);

  return <>{children}</>;
}
