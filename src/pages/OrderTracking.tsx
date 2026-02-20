/**
 * Página para acompanhar pedido
 * Rota: /order
 *
 * Permite buscar pedido por email + externalReference.
 * Suporta ?ref= para preencher número do pedido. PENDING: um auto-refresh após 30s.
 * Em desenvolvimento: ?simulate=PENDING|PAID|... simula um pedido com esse status para QA.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Search, Package, MapPin, Loader2, AlertCircle, Home, RefreshCw, Copy, Check, HelpCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOrder } from '@/services/orders';
import type { OrderResponse, OrderStatus } from '@/types/order';
import { getOrderStatusLabel, getOrderStatusHint } from '@/types/order';
import { pickOrderItemImage } from '@/utils/productImages';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { useOrderEvents } from '@/hooks/useOrderEvents';

const PENDING_AUTO_REFRESH_MS = 30_000;

const ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'PAID', 'READY_FOR_MONTINK', 'SENT_TO_MONTINK',
  'FAILED_MONTINK', 'CANCELED', 'FAILED', 'REFUNDED',
];

function isOrderStatus(s: string | null): s is OrderStatus {
  return s !== null && (ALL_STATUSES as string[]).includes(s);
}

function buildMockOrder(status: OrderStatus): OrderResponse {
  const now = new Date().toISOString();
  return {
    orderId: 'sim-' + status,
    externalReference: 'GEEKERIA-SIM-' + status,
    status,
    totals: { subtotal: 10000, discountTotal: 0, shippingCost: 1000, total: 11000 },
    shipping: { cep: '01310-100', address1: 'Av. Paulista', number: '1000', district: 'Bela Vista', city: 'São Paulo', state: 'SP', complement: null, service: null, deadline: null },
    items: [{ productId: 'prod-sim', quantity: 1, unitPrice: 10000, size: 'M', color: null, name: 'Produto simulado', product: { name: 'Produto simulado', image: 'https://via.placeholder.com/300x300?text=Simulado' } }],
    mpStatus: null,
    mpPaymentId: null,
    montinkStatus: status === 'SENT_TO_MONTINK' || status === 'FAILED_MONTINK' ? 'sim' : null,
    montinkOrderId: status === 'SENT_TO_MONTINK' ? 'MONTINK-SIM' : null,
    payerEmailMasked: 's***@email.com',
    createdAt: now,
    updatedAt: now,
  };
}

const TIMELINE_STEPS = [
  'Pedido recebido',
  'Pagamento confirmado',
  'Em preparação',
  'Enviado',
] as const;

type StepState = 'done' | 'current' | 'todo';

function getTimeline(status: OrderStatus): Array<{ label: string; state: StepState }> {
  const steps = TIMELINE_STEPS.map((label) => ({ label, state: 'todo' as StepState }));
  switch (status) {
    case 'PENDING':
      steps[0].state = 'current';
      return steps;
    case 'PAID':
      steps[0].state = 'done';
      steps[1].state = 'current';
      return steps;
    case 'READY_FOR_MONTINK':
      steps[0].state = 'done';
      steps[1].state = 'done';
      steps[2].state = 'current';
      return steps;
    case 'SENT_TO_MONTINK':
      steps[0].state = 'done';
      steps[1].state = 'done';
      steps[2].state = 'done';
      steps[3].state = 'current';
      return steps;
    case 'FAILED_MONTINK':
      steps[0].state = 'done';
      steps[1].state = 'done';
      steps[2].state = 'current';
      return steps;
    case 'CANCELED':
    case 'FAILED':
    case 'REFUNDED':
      steps[0].state = 'done';
      steps[1].state = 'current';
      return steps;
    default:
      steps[0].state = 'current';
      return steps;
  }
}

type OrderTrackingState = { ref?: string; email?: string } | null;

export default function OrderTracking() {
  useSEO({ title: 'Rastreamento de Pedido | GEEKERIA', description: '', noindex: true });

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') ?? searchParams.get('external_reference') ?? '';
  const state = location.state as OrderTrackingState;

  const [email, setEmail] = useState('');
  const [externalReference, setExternalReference] = useState(refFromUrl);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestAutoFetch, setSuggestAutoFetch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<OrderStatus | null>(null);
  const pendingAutoRefreshDone = useRef(false);
  const stateAppliedRef = useRef(false);

  const statusLabels: Record<string, string> = {
    PAID: '✅ Pagamento confirmado!',
    READY_FOR_MONTINK: '⚙️ Seu pedido está em preparação',
    SENT_TO_MONTINK: '🚚 Seu pedido foi enviado para produção',
    CANCELED: '❌ Pedido cancelado',
  };

  useOrderEvents(
    order?.externalReference ?? null,
    email || null,
    (newStatus) => {
      setOrder((prev) => (prev ? { ...prev, status: newStatus as OrderStatus } : prev));
      const label = statusLabels[newStatus];
      if (label) {
        toast.success(label, {
          duration: 6000,
          style: {
            background: '#2563EB',
            color: '#ffffff',
            border: '1px solid #7C3AED',
            fontFamily: 'var(--font-body)',
          },
        });
      }
    }
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const sim = searchParams.get('simulate');
    if (isOrderStatus(sim)) {
      setOrder(buildMockOrder(sim));
      setEmail('sim@teste.com');
      setExternalReference('GEEKERIA-SIM-' + sim);
      setSimulatedStatus(sim);
      setError(null);
    } else {
      setSimulatedStatus(null);
      setOrder((prev) => (prev?.orderId?.startsWith('sim-') ? null : prev));
    }
  }, [searchParams]);

  useEffect(() => {
    if (refFromUrl && !externalReference) setExternalReference(refFromUrl);
  }, [refFromUrl]);

  useEffect(() => {
    if (!state || stateAppliedRef.current) return;
    stateAppliedRef.current = true;
    if (state.ref) setExternalReference(state.ref);
    if (state.email) setEmail(state.email);
    if (state.ref && state.email) setSuggestAutoFetch(true);
  }, [state]);

  useEffect(() => {
    if (!order || order.status !== 'PENDING' || !email || pendingAutoRefreshDone.current || simulatedStatus !== null) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      pendingAutoRefreshDone.current = true;
      try {
        const updated = await loadOrder(order.externalReference, email);
        if (!cancelled) {
          setOrder(updated);
          if (updated.status !== 'PENDING') toast.success('Status atualizado');
        }
      } catch (err) {
        if (!cancelled) toast.info('Atualização automática em segundo plano. Use "Atualizar status" se precisar.');
      }
    }, PENDING_AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [order?.orderId, order?.status, order?.externalReference, email]);

  const loadOrder = async (ref: string, userEmail: string): Promise<OrderResponse> => {
    return getOrder(ref, userEmail);
  };

  function getErrorMessage(err: unknown): string {
    const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : undefined;
    if (status === 429) return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
    if (status === 404 || status === 400) return 'Não encontramos um pedido com esses dados. Confira o e-mail e o número do pedido.';
    return 'Erro ao buscar pedido. Tente novamente.';
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !externalReference) { toast.error('Preencha email e numero do pedido'); return; }
    setLoading(true); setError(null); setOrder(null);
    try {
      const orderData = await loadOrder(externalReference, email);
      setOrder(orderData);
      // Atualizar URL para tornar link compartilhavel
      const url = new URL(window.location.href);
      url.searchParams.set('ref', externalReference);
      window.history.replaceState(null, '', url.toString());
      toast.success('Pedido encontrado!');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleRefreshStatus = async () => {
    if (!order || !email) return;
    setRefreshing(true); setError(null);
    try {
      const updated = await loadOrder(order.externalReference, email);
      setOrder(updated); toast.success('Status atualizado');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg); toast.error(msg);
    } finally { setRefreshing(false); }
  };

  const handleAutoFetch = async () => {
    if (!externalReference || !email) return;
    setSuggestAutoFetch(false); setLoading(true); setError(null); setOrder(null);
    try {
      const orderData = await loadOrder(externalReference, email);
      setOrder(orderData); toast.success('Pedido encontrado!');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleCopyRef = async () => {
    if (!order?.externalReference) return;
    try {
      await navigator.clipboard.writeText(order.externalReference);
      setCopied(true); toast.success('Número do pedido copiado');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const input = document.createElement('input');
        input.value = order.externalReference;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute'; input.style.left = '-9999px';
        document.body.appendChild(input); input.select();
        document.execCommand('copy'); document.body.removeChild(input);
        setCopied(true); toast.success('Número do pedido copiado');
        setTimeout(() => setCopied(false), 1500);
      } catch { toast.error('Não foi possível copiar. Copie o número manualmente.'); }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmos/5 via-cosmos/3 to-fire/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="card-geek shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-2xl sm:text-3xl text-cosmos flex items-center gap-3 tracking-wide">
              <div className="w-10 h-10 bg-fire/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-fire" />
              </div>
              Acompanhar Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alerta de Simulação - com cores da marca */}
            {order && simulatedStatus && (
              <Alert className="border-cosmos/50 bg-cosmos/10 rounded-xl">
                <AlertCircle className="h-5 w-5 text-cosmos shrink-0" />
                <AlertDescription className="text-cosmos font-body ml-2">
                  Simulação de status: <strong className="font-semibold">{simulatedStatus}</strong>. Altere a URL: <code className="text-xs bg-cosmos/20 px-1.5 py-0.5 rounded text-cosmos">/order?simulate=PAID</code> etc.
                </AlertDescription>
              </Alert>
            )}

            {/* Auto-fetch box - com azul da marca */}
            {suggestAutoFetch && externalReference && email && !simulatedStatus && (
              <div className="rounded-xl border border-cosmos/20 bg-cosmos/5 p-4 sm:p-5">
                <p className="text-sm font-medium text-cosmos mb-3 font-body">
                  Detectamos seu pedido. Quer buscar automaticamente?
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoFetch}
                    disabled={loading}
                    className="bg-fire hover:bg-fire-bright text-white rounded-lg transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Buscar agora
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSuggestAutoFetch(false)}
                    className="border-cosmos/30 text-cosmos hover:bg-cosmos/5 rounded-lg transition-colors"
                  >
                    Agora não
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário de Busca */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cosmos font-body font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg border-cosmos/20 focus:border-fire focus:ring-fire/20 font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalReference" className="text-cosmos font-body font-medium">Número do Pedido</Label>
                <Input
                  id="externalReference"
                  type="text"
                  placeholder="GEEKERIA-..."
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  required
                  className="rounded-lg border-cosmos/20 focus:border-fire focus:ring-fire/20 font-body"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-fire hover:bg-fire-bright text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                size="lg"
                disabled={loading}
              >
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Buscando...</>) : (<><Search className="w-4 h-4 mr-2" />Buscar Pedido</>)}
              </Button>
            </form>

            {/* Erro */}
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-body">{error}</AlertDescription>
              </Alert>
            )}

            {/* Detalhes do Pedido */}
            {order && (
              <div className="space-y-4 mt-6">
                {/* Card Principal do Pedido */}
                <div className="bg-gradient-to-r from-cosmos/5 to-cosmos/3 rounded-xl p-5 sm:p-6 border border-cosmos/15 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium text-cosmos/70 mb-1 font-body">Número do Pedido</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xl sm:text-2xl font-mono font-bold text-cosmos">#{order.externalReference}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-fire hover:bg-fire/10 rounded-lg transition-colors"
                          onClick={handleCopyRef}
                          aria-label="Copiar número do pedido"
                        >
                          {copied ? <Check className="w-4 h-4 mr-1 text-fire" /> : <Copy className="w-4 h-4 mr-1" />}
                          {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-cosmos/70 mb-1 font-body">Status</p>
                      <p className="text-lg font-semibold text-cosmos font-body">{getOrderStatusLabel(order.status)}</p>
                      {getOrderStatusHint(order.status) && (
                        <p className="text-sm text-cosmos/60 mt-1 font-body">{getOrderStatusHint(order.status)}</p>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 pt-4 border-t border-cosmos/10">
                    <p className="text-xs font-medium text-cosmos/70 mb-3 font-body">Etapas do pedido</p>
                    <div className="flex flex-col gap-2">
                      {getTimeline(order.status).map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              step.state === 'done'
                                ? 'bg-fire border-fire'
                                : step.state === 'current'
                                ? 'bg-cosmos border-cosmos'
                                : 'bg-overlay border-rim'
                            }`}
                            aria-hidden
                          >
                            {step.state === 'done' && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span
                            className={`text-sm font-body ${
                              step.state === 'done'
                                ? 'text-fire'
                                : step.state === 'current'
                                ? 'text-cosmos font-medium'
                                : 'text-ink-3'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alerta FAILED_MONTINK - com amarelo da marca */}
                  {order.status === 'FAILED_MONTINK' && (
                    <Alert className="mt-4 border-2 border-cosmos/50 bg-cosmos/10 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-cosmos shrink-0" />
                      <AlertDescription className="text-cosmos font-body ml-2">
                        <span className="font-semibold block mb-1">Problema no envio do pedido</span>
                        Nosso time foi notificado. Em breve entraremos em contato ou você pode falar conosco pelo suporte.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Seção de Ajuda para CANCELADO/FAILED/REFUNDED */}
                  {(order.status === 'CANCELED' || order.status === 'FAILED' || order.status === 'REFUNDED') && (
                    <div className="mt-4 rounded-xl border border-cosmos/10 bg-[#F8FAFC] p-4">
                      <p className="text-sm font-semibold text-cosmos mb-2 flex items-center gap-2 font-body">
                        <MessageCircle className="w-4 h-4 text-cosmos" />
                        Precisa de ajuda?
                      </p>
                      <p className="text-sm text-cosmos/70 mb-3 font-body">
                        {order.status === 'REFUNDED'
                          ? 'Seu pedido foi reembolsado. Se tiver duvidas, fale com nosso suporte.'
                          : 'Se seu pedido foi cancelado ou nao concluiu, entre em contato com nosso suporte.'}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        asChild
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
                      >
                        <a
                          href={buildWhatsAppLink(
                            `Olá! Preciso de ajuda com meu pedido. Referencia: ${order.externalReference}. Status: ${getOrderStatusLabel(order.status)}. Pode me orientar?`
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          FALAR NO WHATSAPP
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Botão Atualizar Status */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 border-cosmos/30 text-cosmos hover:bg-cosmos/5 rounded-lg transition-colors"
                    onClick={handleRefreshStatus}
                    disabled={refreshing || simulatedStatus !== null}
                  >
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Atualizar status
                  </Button>
                </div>

                {/* Resumo do Pedido */}
                <div className="bg-surface rounded-xl border border-cosmos/10 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-fire/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-fire" />
                    </div>
                    <h3 className="font-display text-lg text-cosmos tracking-wide">Resumo do Pedido</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-cosmos/60 font-body">Subtotal:</span>
                      <span className="font-medium text-cosmos font-body">{formatCurrency(order.totals.subtotal)}</span>
                    </div>
                    {order.totals.discountTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-fire font-body">Desconto:</span>
                        <span className="font-medium text-fire font-body">-{formatCurrency(order.totals.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-cosmos/60 font-body">Frete:</span>
                      <span className="font-medium text-cosmos font-body">{formatCurrency(order.totals.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-cosmos/10 items-center">
                      <span className="font-semibold text-cosmos font-body">Total:</span>
                      <span className="font-bold text-lg sm:text-xl text-fire font-body">{formatCurrency(order.totals.total)}</span>
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-cosmos/10">
                      <p className="text-xs font-medium text-cosmos/70 mb-2 font-body">Itens ({order.items.length}):</p>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => {
                          const thumb = pickOrderItemImage(item);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={item.name || 'Produto'}
                                  className="w-12 h-12 rounded-lg object-cover border border-cosmos/10 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-cosmos/5 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-cosmos/30" />
                                </div>
                              )}
                              <div className="text-xs text-cosmos/60 font-body min-w-0">
                                <p className="font-medium text-cosmos/80 truncate">
                                  {item.quantity}x {item.name || `Produto ${item.productId.substring(0, 8)}`}
                                </p>
                                <p className="text-cosmos/40">
                                  {item.size && <>Tamanho: {item.size}</>}
                                  {item.size && item.color && ' — '}
                                  {item.color && <>Cor: {item.color}</>}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Destino (apenas cidade/UF por privacidade) */}
                  {order.shipping.city && order.shipping.state && (
                    <div className="mt-4 pt-4 border-t border-cosmos/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cosmos/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-cosmos" />
                        </div>
                        <div className="text-xs text-cosmos/70 font-body">
                          <p className="font-medium text-cosmos">Destino: {order.shipping.city} - {order.shipping.state}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.montinkOrderId && (
                    <div className="mt-4 pt-4 border-t border-cosmos/10">
                      <p className="text-xs font-medium text-cosmos/70 mb-1 font-body">Código de envio</p>
                      <p className="text-xs font-mono text-cosmos/60">{order.montinkOrderId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ajuda Rápida */}
            <div className="rounded-xl border border-cosmos/10 bg-[#F8FAFC] p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-cosmos flex items-center gap-2 mb-3 font-body">
                <HelpCircle className="w-4 h-4 text-cosmos" />
                Ajuda rápida
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="font-medium text-cosmos font-body">Onde encontro o número do pedido?</span>
                  <span className="block text-cosmos/60 font-body">No e-mail de confirmação e na tela de pagamento.</span>
                </li>
                <li>
                  <span className="font-medium text-cosmos font-body">Meu pagamento está pendente.</span>
                  <span className="block text-cosmos/60 font-body">Pode levar alguns minutos para atualizar após o pagamento.</span>
                </li>
                <li>
                  <span className="font-medium text-cosmos font-body">O e-mail precisa ser o mesmo da compra?</span>
                  <span className="block text-cosmos/60 font-body">Sim, por segurança.</span>
                </li>
                <li>
                  <span className="font-medium text-cosmos font-body">Atualização do status</span>
                  <span className="block text-cosmos/60 font-body">Use "Atualizar status" se acabou de pagar.</span>
                </li>
              </ul>
            </div>

            {/* CTAs de rodape */}
            <div className="pt-4 border-t border-cosmos/10 space-y-3">
              {order?.externalReference && (
                <Button
                  variant="ghost"
                  className="w-full text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10 rounded-lg transition-all duration-300"
                  size="lg"
                  asChild
                >
                  <a
                    href={buildWhatsAppLink(
                      `Olá! Quero acompanhar meu pedido. Referencia: ${order.externalReference}. Pode me ajudar?`
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    FALAR NO WHATSAPP
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-2 border-fire text-fire hover:bg-fire hover:text-white rounded-lg transition-all duration-300"
                onClick={() => navigate('/catalogo')}
              >
                <Home className="w-4 h-4 mr-2" />
                VOLTAR AO CATALOGO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
