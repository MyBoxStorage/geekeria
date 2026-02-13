import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Home, MapPin, Loader2, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState, useRef } from 'react';
import { getOrder } from '@/services/orders';
import type { OrderResponse } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference') ?? searchParams.get('ref');
  const [trackOrderRef] = useState<string | null>(() => {
    const fromUrl = searchParams.get('ref') ?? searchParams.get('external_reference');
    if (fromUrl) return fromUrl;
    try {
      const raw = localStorage.getItem('bb_order_pending');
      if (!raw) return null;
      const data = JSON.parse(raw) as { externalReference?: string };
      return data.externalReference ?? null;
    } catch {
      return null;
    }
  });
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const refToLoad = trackOrderRef ?? externalReference;
    if (!refToLoad) {
      setLoading(false);
      return;
    }

    let pendingEmail: string | null = null;
    try {
      const pendingRaw = localStorage.getItem('bb_order_pending');
      const pending = pendingRaw ? (JSON.parse(pendingRaw) as { externalReference?: string; email?: string } | null) : null;
      if (pending?.externalReference === refToLoad) {
        pendingEmail = pending?.email ?? null;
      }
      pendingEmailRef.current = pendingEmail;
    } catch {
      pendingEmailRef.current = null;
    }

    if (!refToLoad || !pendingEmail) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const orderData = await getOrder(refToLoad, pendingEmail!);
        setOrder(orderData);
      } catch {
        toast.error('Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [trackOrderRef, externalReference]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto animate-bounce" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Pagamento Aprovado! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Seu pedido foi confirmado com sucesso e já está sendo processado.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : (
            <>
              {(externalReference || trackOrderRef) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-700">Número do Pedido</p>
                  </div>
                  <p className="text-2xl font-mono font-bold text-green-900">
                    #{externalReference || trackOrderRef}
                  </p>
                </div>
              )}

              {!loading && trackOrderRef && !order && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  Para acompanhar, use o botão abaixo e informe seu e-mail.
                </p>
              )}

              {order && (
                <div className="mb-6 space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(order.totals.subtotal)}</span>
                      </div>
                      {order.totals.discountTotal > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span className="font-medium">-{formatCurrency(order.totals.discountTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frete:</span>
                        <span className="font-medium">{formatCurrency(order.totals.shippingCost)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="font-bold text-lg text-gray-900">{formatCurrency(order.totals.total)}</span>
                      </div>
                    </div>

                    {order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Itens ({order.items.length}):</p>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              {item.quantity}x {item.name || `Produto ${item.productId.substring(0, 8)}`}
                              {item.size && ` - Tamanho: ${item.size}`}
                              {item.color && ` - Cor: ${item.color}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.shipping.address1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div className="text-xs text-gray-600">
                            <p className="font-medium">{order.shipping.address1}</p>
                            {order.shipping.number && <p>Nº {order.shipping.number}</p>}
                            {order.shipping.complement && <p>{order.shipping.complement}</p>}
                            {order.shipping.district && <p>{order.shipping.district}</p>}
                            {order.shipping.city && order.shipping.state && (
                              <p>{order.shipping.city} - {order.shipping.state}</p>
                            )}
                            {order.shipping.cep && <p>CEP: {order.shipping.cep}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Próximos passos:</strong> Estamos preparando seu pedido para envio.
                </p>
              </div>
            </>
          )}

          {paymentId && (
            <p className="text-sm text-gray-500 mb-4">
              ID do Pagamento: <span className="font-mono">{paymentId}</span>
            </p>
          )}

          <div className="space-y-3">
            {trackOrderRef ? (
              <Button
                className="w-full"
                size="lg"
                variant="default"
                onClick={() => {
                  const emailForState = pendingEmailRef.current ?? undefined;
                  navigate(`/order?ref=${encodeURIComponent(trackOrderRef)}`, {
                    state: { ref: trackOrderRef, email: emailForState },
                  });
                  localStorage.removeItem('bb_order_pending');
                  localStorage.removeItem('pixPaymentData');
                }}
              >
                <PackageSearch className="w-4 h-4 mr-2" />
                Acompanhar meu pedido
              </Button>
            ) : (
              <p className="text-sm text-gray-600 py-2">
                Consulte seu e-mail para acompanhar o pedido.
              </p>
            )}
            <Link to="/" className="block">
              <Button className="w-full" size="lg" variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Voltar para a Loja
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Você receberá um email de confirmação em breve com os detalhes do pedido.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
