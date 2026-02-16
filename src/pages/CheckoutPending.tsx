import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Clock, QrCode, Barcode, Home, Mail, Copy, Check, Package, MapPin, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { getOrder } from '@/services/orders';
import { getPaymentDetails } from '@/services/mp-payment';
import type { OrderResponse } from '@/types/order';
import { formatCurrency } from '@/lib/utils';

interface PixPaymentData {
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  paymentId: string;
  externalReference: string;
  timestamp: number;
}

interface PendingOrderData {
  orderId: string;
  externalReference: string;
  email?: string;
  timestamp: number;
}

/** Verifica se o valor parece ser um payment_id numérico do MP (não external_reference) */
function isValidMpPaymentId(value: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^\d+$/.test(value.trim());
}

export default function CheckoutPending() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('payment_id');
  const orderId = searchParams.get('order_id') ?? searchParams.get('external_reference');
  const externalReference = searchParams.get('external_reference') ?? orderId;
  const paymentMethod = searchParams.get('payment_type_id');

  if (import.meta.env.DEV) {
    console.log('🔍 Debug Pending Page:');
    console.log('- Order ID:', orderId);
    console.log('- Payment ID:', paymentId);
    console.log('- External Reference:', externalReference);
    console.log('- Payment Type:', paymentMethod);
    console.log('- isValidMpPaymentId(paymentId):', isValidMpPaymentId(paymentId));
  }

  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [pixLoadFailed, setPixLoadFailed] = useState<false | 'FAILED' | 'RATE_LIMIT'>(false);
  const [pixLoading, setPixLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStartTimeRef = useRef<number>(Date.now());
  const MAX_POLLING_TIME = 5 * 60 * 1000; // 5 minutos

  const isPix = paymentMethod === 'pix' || paymentMethod === 'account_money';
  const isBoleto = paymentMethod === 'bolbradesco' || paymentMethod === 'ticket';

  function persistPixToStorage(data: PixPaymentData) {
    try {
      const key = data.externalReference ? `bb_pix_${data.externalReference}` : 'pixPaymentData';
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }

  // Carregar dados do PIX: localStorage primeiro, depois API por payment_id ou por order.mpPaymentId
  useEffect(() => {
    if (!isPix) {
      setPixLoading(false);
      return;
    }

    let cancelled = false;

    function tryLocalStorage(): PixPaymentData | null {
      const keysToTry = [
        externalReference ? `bb_pix_${externalReference}` : null,
        'pixPaymentData',
        'bb_pix_last',
      ].filter(Boolean) as string[];
      for (const key of keysToTry) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const data = JSON.parse(raw) as PixPaymentData;
          if (
            (paymentId && data.paymentId === paymentId) ||
            (externalReference && data.externalReference === externalReference)
          ) {
            return data;
          }
        } catch {
          // ignore
        }
      }
      return null;
    }

    const fromStorage = tryLocalStorage();
    if (fromStorage) {
      setPixData(fromStorage);
      setPixLoadFailed(false);
      setPixLoading(false);
      return;
    }

    async function fetchByPaymentId(id: string): Promise<boolean> {
      try {
        const res = await getPaymentDetails(id);
        if (cancelled) return false;

        if (!res.ok) {
          if (res.status === 429) {
            setPixLoadFailed('RATE_LIMIT');
            return false;
          }
          setPixLoadFailed('FAILED');
          return false;
        }

        const td = res.transaction_details;
        const ref = (res.external_reference as string) || externalReference || '';
        const data: PixPaymentData = {
          paymentId: String(res.id ?? id),
          externalReference: ref,
          qrCode: td?.qr_code ?? '',
          qrCodeBase64: td?.qr_code_base64 ?? '',
          timestamp: Date.now(),
        };

        if (data.qrCode || data.qrCodeBase64) {
          setPixData(data);
          setPixLoadFailed(false);
          if (ref) persistPixToStorage(data);
          return true;
        }
        setPixLoadFailed('FAILED');
        return false;
      } catch {
        setPixLoadFailed('FAILED');
        return false;
      }
    }

    async function fetchPaymentByOrder(ref: string): Promise<boolean> {
      let email: string | null = null;
      try {
        const pendingRaw = localStorage.getItem('bb_order_pending');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw) as PendingOrderData;
          if (pending.externalReference === ref && pending.email) {
            email = pending.email;
          }
        }
      } catch {
        // ignore
      }
      if (!email) return false;
      try {
        const orderData = await getOrder(ref, email);
        if (cancelled) return false;
        const mpId = orderData.mpPaymentId;
        if (mpId && isValidMpPaymentId(String(mpId))) {
          return fetchByPaymentId(String(mpId));
        }
        if (import.meta.env.DEV && ref) {
          console.log('CheckoutPending: Pedido ainda não tem mpPaymentId do MP');
        }
      } catch (err) {
        console.error('CheckoutPending: Error fetching order by reference:', err);
      }
      return false;
    }

    async function run() {
      // 1. Se payment_id é numérico (MP real), buscar direto
      if (paymentId && isValidMpPaymentId(paymentId)) {
        const ok = await fetchByPaymentId(paymentId);
        if (cancelled) return;
        if (ok) {
          setPixLoading(false);
          return;
        }
      }

      // 2. Se payment_id parece ser order_id/external_reference OU não temos payment_id, buscar por order
      const refToUse = orderId ?? externalReference;
      if (refToUse) {
        const ok = await fetchPaymentByOrder(refToUse);
        if (cancelled) return;
        if (ok) {
          setPixLoading(false);
          return;
        }
      }

      if (cancelled) return;
      setPixLoading(false);
      if (paymentId || externalReference) {
        setPixLoadFailed('FAILED');
      }
      if (!paymentId && !externalReference) {
        if (import.meta.env.DEV) {
          console.warn(
            'CheckoutPending: Nenhum dado do PIX encontrado e nenhum identificador na URL (payment_id ou external_reference).'
          );
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isPix, paymentId, orderId, externalReference, refreshTrigger]);

  // Carregar dados do pedido e iniciar polling
  useEffect(() => {
    if (!externalReference) return;

    // Recuperar email do pedido pendente salvo no localStorage
    let emailFromLocalStorage: string | null = null;
    try {
      const pendingRaw = localStorage.getItem('bb_order_pending');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw) as PendingOrderData;
        if (pending.externalReference === externalReference && pending.email) {
          emailFromLocalStorage = pending.email;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar bb_order_pending do localStorage:', error);
    }

    // Se não tivermos email, não fazemos polling de detalhes (mantém apenas tela de pendência)
    if (!emailFromLocalStorage) {
      return;
    }

    const loadOrder = async () => {
      try {
        const orderData = await getOrder(externalReference, emailFromLocalStorage as string);
        setOrder(orderData);

        // Se status mudou para READY_FOR_MONTINK ou PAID, redirecionar
        if (orderData.status === 'READY_FOR_MONTINK' || orderData.status === 'PAID') {
          navigate(`/checkout/success?external_reference=${externalReference}&payment_id=${paymentId || ''}`);
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
      }
    };

    loadOrder();

    // Iniciar polling a cada 10s por até 5 minutos
    pollingStartTimeRef.current = Date.now();
    pollingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - pollingStartTimeRef.current;
      if (elapsed >= MAX_POLLING_TIME) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      loadOrder();
    }, 10000); // 10 segundos

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [externalReference, paymentId, navigate]);
  
  // Função para copiar código PIX
  const handleCopyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode).then(() => {
        setCopied(true);
        toast.success('Código PIX copiado para a área de transferência!');
        
        setTimeout(() => setCopied(false), 3000);
      }).catch((error) => {
        console.error('Erro ao copiar código PIX:', error);
        toast.error('Erro ao copiar código. Tente novamente.');
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <Clock className="w-24 h-24 text-amber-500 mx-auto animate-pulse" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Pagamento Pendente
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Aguardando confirmação do pagamento.
          </p>
          
          {externalReference && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 mb-6 border border-amber-200">
              <p className="text-sm font-medium text-amber-700 mb-2">Número do Pedido</p>
              <p className="text-2xl font-mono font-bold text-amber-900">
                #{externalReference}
              </p>
            </div>
          )}
          
          {/* SEÇÃO DO QR CODE PIX */}
          {isPix && pixData && (
            <div className="mb-6 space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <QrCode className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>PIX:</strong> Escaneie o QR Code abaixo ou copie o código para pagar. Você tem até 30 minutos.
                </AlertDescription>
              </Alert>
              
              {/* QR CODE IMAGE */}
              {pixData.qrCodeBase64 ? (
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-lg">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64 mx-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Escaneie este QR Code com o app do seu banco
                  </p>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-lg">
                  <p className="text-sm text-gray-600">
                    QR Code indisponível no momento. Use o código PIX &quot;copia e cola&quot; abaixo.
                  </p>
                </div>
              )}
              
              {/* CÓDIGO COPIA E COLA */}
              {pixData.qrCode && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Código PIX Copia e Cola:
                  </p>
                  <div className="bg-white p-3 rounded border border-gray-300 mb-3 max-h-24 overflow-y-auto">
                    <p className="text-xs font-mono break-all text-gray-600">
                      {pixData.qrCode.length > 100 
                        ? `${pixData.qrCode.substring(0, 100)}...` 
                        : pixData.qrCode}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyPixCode}
                    className="w-full"
                    variant={copied ? "secondary" : "default"}
                    size="lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Código PIX
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Alerta PIX sem dados (fallback) */}
          {isPix && !pixData && !pixLoading && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <QrCode className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {pixLoadFailed === 'RATE_LIMIT' ? (
                  <>
                    <strong>PIX:</strong> Muitas tentativas em pouco tempo. Aguarde 1 minuto e toque em Atualizar.
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setPixLoadFailed(false);
                          setPixLoading(true);
                          setRefreshTrigger((t) => t + 1);
                        }}
                      >
                        Atualizar
                      </Button>
                    </div>
                  </>
                ) : pixLoadFailed === 'FAILED' ? (
                  <>
                    <strong>PIX:</strong> Não foi possível carregar o QR Code aqui.
                    {externalReference && (
                      <> Consulte seu pedido com o número <strong>#{externalReference}</strong> ou verifique seu email.</>
                    )}
                    {!externalReference && ' Volte para a loja ou verifique seu email para as instruções de pagamento.'}
                  </>
                ) : (
                  <>
                    <strong>PIX:</strong> O QR Code foi gerado. Você tem até 30 minutos para realizar o pagamento.
                    <br />
                    <span className="text-xs text-blue-600 mt-1 block">
                      As instruções de pagamento foram enviadas para seu email.
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {isBoleto && (
            <Alert className="mb-6 border-purple-200 bg-purple-50">
              <Barcode className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>Boleto:</strong> Você pode pagar até a data de vencimento. O prazo de compensação é de 1 a 3 dias úteis.
              </AlertDescription>
            </Alert>
          )}
          
          {paymentId && (
            <p className="text-sm text-gray-500 mb-6">
              ID do Pagamento: <span className="font-mono">{paymentId}</span>
            </p>
          )}

          {/* Resumo do Pedido */}
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
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-700">Enviamos por email</p>
            </div>
            <p className="text-xs text-blue-600">
              {isPix && pixData && 'Você pode pagar usando o QR Code ou código acima, ou verificar seu email.'}
              {isPix && !pixData && 'O QR Code e o código PIX Copia e Cola foram enviados para seu email.'}
              {isBoleto && 'O boleto foi enviado para seu email. Você também pode baixá-lo pelo link que enviamos.'}
              {!isPix && !isBoleto && 'As instruções de pagamento foram enviadas para seu email.'}
            </p>
          </div>
          
          <div className="space-y-3">
            {(externalReference || order?.externalReference) ? (
              <Button
                className="w-full"
                size="lg"
                variant="default"
                onClick={() => {
                  const ref = externalReference || order?.externalReference || '';
                  let email: string | undefined;
                  try {
                    const pendingRaw = localStorage.getItem('bb_order_pending');
                    const pending = pendingRaw ? (JSON.parse(pendingRaw) as PendingOrderData | null) : null;
                    if (pending?.externalReference === ref && pending?.email) {
                      email = pending.email;
                    }
                  } catch {
                    // ignore
                  }
                  navigate(`/order?ref=${encodeURIComponent(ref)}`, {
                    state: { ref, email },
                  });
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
            Assim que o pagamento for confirmado, você receberá uma notificação por email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
