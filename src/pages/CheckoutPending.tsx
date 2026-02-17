import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Clock, QrCode, Barcode, Home, Mail, Copy, Check, Package, MapPin, PackageSearch, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { getOrder } from '@/services/orders';
import { getPaymentDetails } from '@/services/mp-payment';
import type { OrderResponse } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import { buildWhatsAppLink } from '@/utils/whatsapp';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFCC29]/10 via-[#FFCC29]/5 to-[#00843D]/10 p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0 rounded-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 text-center">
          {/* Ícone Principal com animação pulse-slow */}
          <div className="mb-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-[#FFCC29]/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <Clock className="w-20 h-20 sm:w-24 sm:h-24 text-[#FFCC29] relative z-10 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Título com font-display (Bebas Neue) */}
          <h1 className="font-display text-3xl sm:text-4xl text-[#002776] mb-3 tracking-wide">
            Pagamento Pendente
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-lg text-[#002776]/70 mb-6 font-body">
            Aguardando confirmação do pagamento.
          </p>

          {/* Badge de Status Pendente */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-[#FFCC29]/15 text-[#FFCC29] border border-[#FFCC29]/30 rounded-full px-4 py-2 text-sm font-medium">
              <Clock className="w-4 h-4" />
              Aguardando Pagamento
            </span>
          </div>

          {/* Card do Número do Pedido - com cores da marca */}
          {externalReference && (
            <div className="bg-gradient-to-r from-[#FFCC29]/10 to-[#FFCC29]/5 rounded-xl p-5 sm:p-6 mb-6 border border-[#FFCC29]/30 hover:shadow-lg transition-shadow duration-300">
              <p className="text-sm font-medium text-[#002776]/70 mb-2 font-body">Número do Pedido</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-[#002776]">
                #{externalReference}
              </p>
            </div>
          )}

          {/* SEÇÃO DO QR CODE PIX */}
          {isPix && pixData && (
            <div className="mb-6 space-y-4">
              {/* Alerta PIX com cores da marca (azul #002776) */}
              <Alert className="border-[#002776]/30 bg-[#002776]/5 rounded-xl">
                <QrCode className="h-5 w-5 text-[#002776] flex-shrink-0" />
                <AlertDescription className="text-[#002776] text-left ml-2 font-body">
                  <strong className="font-semibold">PIX:</strong> Escaneie o QR Code abaixo ou copie o código para pagar. Você tem até <span className="font-semibold">30 minutos</span>.
                </AlertDescription>
              </Alert>

              {/* QR CODE IMAGE */}
              {pixData.qrCodeBase64 ? (
                <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-[#002776]/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-56 h-56 sm:w-64 sm:h-64 mx-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                  <p className="text-xs text-[#002776]/60 mt-3 font-body">
                    Abra o app do seu banco e pague via PIX
                  </p>
                </div>
              ) : (
                <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-[#002776]/20 shadow-lg">
                  <p className="text-sm text-[#002776]/70 font-body">
                    QR Code indisponível no momento. Use o código PIX &quot;copia e cola&quot; abaixo.
                  </p>
                </div>
              )}

              {/* CÓDIGO COPIA E COLA */}
              {pixData.qrCode && (
                <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-xl border border-[#002776]/10">
                  <p className="text-sm font-medium text-[#002776] mb-3 font-body">
                    Código PIX Copia e Cola:
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-[#002776]/20 mb-4 max-h-28 overflow-y-auto">
                    <p className="text-xs font-mono break-all text-[#002776]/70">
                      {pixData.qrCode.length > 100
                        ? `${pixData.qrCode.substring(0, 100)}...`
                        : pixData.qrCode}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyPixCode}
                    className={`w-full rounded-lg transition-all duration-300 ${
                      copied
                        ? 'bg-[#00843D] hover:bg-[#006633] text-white'
                        : 'bg-[#002776] hover:bg-[#002776]/90 text-white'
                    }`}
                    size="lg"
                    aria-label={copied ? 'Código copiado' : 'Copiar código PIX'}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        COPIAR CÓDIGO PIX
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Alerta PIX sem dados (fallback) - com cores da marca */}
          {isPix && !pixData && !pixLoading && (
            <Alert className="mb-6 border-[#002776]/30 bg-[#002776]/5 rounded-xl">
              <QrCode className="h-5 w-5 text-[#002776] flex-shrink-0" />
              <AlertDescription className="text-[#002776] text-left ml-2 font-body">
                {pixLoadFailed === 'RATE_LIMIT' ? (
                  <>
                    <strong className="font-semibold">PIX:</strong> Muitas tentativas em pouco tempo. Aguarde 1 minuto e toque em Atualizar.
                    <div className="mt-4">
                      <Button
                        type="button"
                        className="bg-[#00843D] hover:bg-[#006633] text-white rounded-lg transition-colors"
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
                    <strong className="font-semibold">PIX:</strong> Não foi possível carregar o QR Code aqui.
                    {externalReference && (
                      <> Consulte seu pedido com o número <strong className="font-semibold">#{externalReference}</strong> ou verifique seu email.</>
                    )}
                    {!externalReference && ' Volte para a loja ou verifique seu email para as instruções de pagamento.'}
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">PIX:</strong> O QR Code foi gerado. Você tem até 30 minutos para realizar o pagamento.
                    <br />
                    <span className="text-xs text-[#002776]/70 mt-2 block">
                      As instruções de pagamento foram enviadas para seu email.
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta Boleto - corrigido para usar azul da marca (#002776) em vez de purple */}
          {isBoleto && (
            <Alert className="mb-6 border-[#002776]/30 bg-[#002776]/5 rounded-xl">
              <Barcode className="h-5 w-5 text-[#002776] flex-shrink-0" />
              <AlertDescription className="text-[#002776] text-left ml-2 font-body">
                <strong className="font-semibold">Boleto:</strong> Você pode pagar até a data de vencimento. O prazo de compensação é de <span className="font-semibold">1 a 3 dias úteis</span>.
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo do Pedido */}
          {order && (
            <div className="mb-6 space-y-4">
              <div className="bg-white rounded-xl border border-[#002776]/10 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-[#00843D]/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-[#00843D]" />
                  </div>
                  <h3 className="font-display text-lg text-[#002776] tracking-wide">Resumo do Pedido</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#002776]/60 font-body">Subtotal:</span>
                    <span className="font-medium text-[#002776] font-body">{formatCurrency(order.totals.subtotal)}</span>
                  </div>
                  {order.totals.discountTotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#00843D] font-body">Desconto:</span>
                      <span className="font-medium text-[#00843D] font-body">-{formatCurrency(order.totals.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[#002776]/60 font-body">Frete:</span>
                    <span className="font-medium text-[#002776] font-body">{formatCurrency(order.totals.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[#002776]/10 items-center">
                    <span className="font-semibold text-[#002776] font-body">Total:</span>
                    <span className="font-bold text-lg sm:text-xl text-[#00843D] font-body">{formatCurrency(order.totals.total)}</span>
                  </div>
                </div>

                {order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#002776]/10">
                    <p className="text-xs font-medium text-[#002776]/70 mb-2 font-body">Itens ({order.items.length}):</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-[#002776]/60 font-body">
                          {item.quantity}x {item.name || `Produto ${item.productId.substring(0, 8)}`}
                          {item.size && <span className="text-[#002776]/40"> — Tamanho: {item.size}</span>}
                          {item.color && <span className="text-[#002776]/40"> — Cor: {item.color}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.shipping.address1 && (
                  <div className="mt-4 pt-4 border-t border-[#002776]/10">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#002776]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-[#002776]" />
                      </div>
                      <div className="text-xs text-[#002776]/70 font-body text-left">
                        <p className="font-medium text-[#002776]">{order.shipping.address1}</p>
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

          {/* Seção "Enviamos por email" - com cores da marca */}
          <div className="mb-6 p-4 sm:p-5 bg-[#002776]/5 rounded-xl border border-[#002776]/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#002776]/10 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#002776]" />
              </div>
              <p className="text-sm font-semibold text-[#002776] font-body">Enviamos por email</p>
            </div>
            <p className="text-xs text-[#002776]/60 font-body leading-relaxed">
              {isPix && pixData && 'Você pode pagar usando o QR Code ou código acima, ou verificar seu email.'}
              {isPix && !pixData && 'O QR Code e o código PIX Copia e Cola foram enviados para seu email.'}
              {isBoleto && 'O boleto foi enviado para seu email. Você também pode baixá-lo pelo link que enviamos.'}
              {!isPix && !isBoleto && 'As instruções de pagamento foram enviadas para seu email.'}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {(externalReference || order?.externalReference) ? (
              <Button
                className="w-full bg-[#00843D] hover:bg-[#006633] text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                size="lg"
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
                aria-label="Acompanhar meu pedido"
              >
                <PackageSearch className="w-4 h-4 mr-2" />
                ACOMPANHAR PEDIDO
              </Button>
            ) : (
              <p className="text-sm text-[#002776]/60 py-2 font-body">
                Verifique seu e-mail para instruções de pagamento e acompanhamento.
              </p>
            )}
            <Link to="/catalogo" className="block">
              <Button
                className="w-full border-2 border-[#00843D] text-[#00843D] hover:bg-[#00843D] hover:text-white rounded-lg transition-all duration-300"
                size="lg"
                variant="outline"
                aria-label="Voltar ao catálogo"
              >
                <Home className="w-4 h-4 mr-2" />
                VOLTAR AO CATÁLOGO
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10 rounded-lg transition-all duration-300"
              size="lg"
              asChild
            >
              <a
                href={buildWhatsAppLink(
                  (() => {
                    const ref = externalReference || order?.externalReference;
                    const tipo = isPix ? ' (PIX)' : '';
                    return ref
                      ? `Olá! Estou com um pagamento pendente${tipo} e quero confirmar o status do meu pedido. Referência: ${ref}. Pode me ajudar?`
                      : `Olá! Estou com um pagamento pendente${tipo} e preciso de ajuda. Pode me orientar?`;
                  })()
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                FALAR NO WHATSAPP
              </a>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#002776]/50 mt-6 font-body">
            Após o pagamento, a confirmação pode levar alguns instantes. Você receberá uma notificação por e-mail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
