/**
 * Payment Brick - Mercado Pago React SDK
 * 
 * Componente oficial do Mercado Pago para processamento de pagamentos.
 * Suporta múltiplos métodos de pagamento: cartão, PIX, boleto, etc.
 * 
 * Documentação: https://github.com/mercadopago/sdk-react
 */

import { Payment } from '@mercadopago/sdk-react';
import { useMemo } from 'react';
import type { CartItem } from '@/types';
import { generateExternalReference } from '@/config/mercadopago.config';

interface PaymentBrickProps {
  amount: number;
  items: CartItem[];
  payerEmail: string;
  payerName?: string;
  onReady?: () => void;
  onSubmit?: (formData: any) => Promise<unknown>;
  onError?: (error: any) => void;
}

export function PaymentBrick({
  amount,
  items,
  payerEmail,
  payerName,
  onReady,
  onSubmit,
  onError,
}: PaymentBrickProps) {
  // Prepara os dados de inicialização do Payment Brick
  // Usando useMemo para evitar recriações desnecessárias
  const initialization = useMemo(() => {
    const externalReference = generateExternalReference();

    return {
      amount: amount,
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
        picture_url: item.product.image.startsWith('/')
          ? `${window.location.origin}${item.product.image}`
          : item.product.image,
        category_id: item.product.category,
        quantity: item.quantity,
        unit_price: item.product.price,
      })),
      external_reference: externalReference,
      statement_descriptor: 'BRAVOS BRASIL',
      back_urls: {
        success: `${window.location.origin}/checkout/success`,
        failure: `${window.location.origin}/checkout/failure`,
        pending: `${window.location.origin}/checkout/pending`,
      },
      ...(import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL && {
        notification_url: import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL,
      }),
    };
  }, [amount, items, payerEmail, payerName]);

  return (
    <Payment
      initialization={initialization}
      customization={{
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          ticket: 'all',
          bankTransfer: ['pix'],
        },
      }}
      onSubmit={onSubmit || (async () => Promise.resolve())}
      onReady={onReady}
      onError={onError}
    />
  );
}
