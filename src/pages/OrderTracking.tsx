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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOrder } from '@/services/orders';
import type { OrderResponse, OrderStatus } from '@/types/order';
import { getOrderStatusLabel, getOrderStatusHint } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

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
    externalReference: 'BRAVOS-SIM-' + status,
    status,
    totals: { subtotal: 10000, discountTotal: 0, shippingCost: 1000, total: 11000 },
    shipping: { cep: '01310-100', address1: 'Av. Paulista', number: '1000', district: 'Bela Vista', city: 'São Paulo', state: 'SP', complement: null, service: null, deadline: null },
    items: [{ productId: 'prod-sim', quantity: 1, unitPrice: 10000, size: 'M', color: null, name: 'Produto simulado' }],
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

  // Simulação de status (apenas em dev): ?simulate=PENDING | PAID | FAILED_MONTINK | ...
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const sim = searchParams.get('simulate');
    if (isOrderStatus(sim)) {
      setOrder(buildMockOrder(sim));
      setEmail('sim@teste.com');
      setExternalReference('BRAVOS-SIM-' + sim);
      setSimulatedStatus(sim);
      setError(null);
    } else {
      setSimulatedStatus(null);
      setOrder((prev) => (prev?.orderId?.startsWith('sim-') ? null : prev));
    }
  }, [searchParams]);

  // Pre-fill from URL (e.g. after navigation from success/pending)
  useEffect(() => {
    if (refFromUrl && !externalReference) setExternalReference(refFromUrl);
  }, [refFromUrl]);

  // Pre-fill ref and email from navigate state (memory only; no email in URL)
  useEffect(() => {
    if (!state || stateAppliedRef.current) return;
    stateAppliedRef.current = true;
    if (state.ref) setExternalReference(state.ref);
    if (state.email) setEmail(state.email);
    if (state.ref && state.email) setSuggestAutoFetch(true);
  }, [state]);

  // Single auto-refresh for PENDING orders, once per page load; cleanup on unmount (skip when simulating)
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

  const loadOrder = async (
    ref: string,
    userEmail: string
  ): Promise<OrderResponse> => {
    return getOrder(ref, userEmail);
  };

  function getErrorMessage(err: unknown): string {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : undefined;
    if (status === 429) return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
    if (status === 404 || status === 400)
      return 'Não encontramos um pedido com esses dados. Confira o e-mail e o número do pedido.';
    return 'Erro ao buscar pedido. Tente novamente.';
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !externalReference) {
      toast.error('Preencha email e número do pedido');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const orderData = await loadOrder(externalReference, email);
      setOrder(orderData);
      toast.success('Pedido encontrado!');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!order || !email) return;
    setRefreshing(true);
    setError(null);
    try {
      const updated = await loadOrder(order.externalReference, email);
      setOrder(updated);
      toast.success('Status atualizado');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAutoFetch = async () => {
    if (!externalReference || !email) return;
    setSuggestAutoFetch(false);
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const orderData = await loadOrder(externalReference, email);
      setOrder(orderData);
      toast.success('Pedido encontrado!');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = async () => {
    if (!order?.externalReference) return;
    try {
      await navigator.clipboard.writeText(order.externalReference);
      setCopied(true);
      toast.success('Número do pedido copiado');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const input = document.createElement('input');
        input.value = order.externalReference;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        toast.success('Número do pedido copiado');
        setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error('Não foi possível copiar. Copie o número manualmente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="w-6 h-6" />
              Acompanhar Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {order && simulatedStatus && (
              <Alert className="border-violet-300 bg-violet-50 [&_[data-slot=alert-description]]:text-violet-900">
                <AlertCircle className="h-4 w-4 text-violet-600 shrink-0" />
                <AlertDescription>
                  Simulação de status: <strong>{simulatedStatus}</strong>. Altere a URL: <code className="text-xs bg-violet-100 px-1 rounded">/order?simulate=PAID</code> etc.
                </AlertDescription>
              </Alert>
            )}
            {suggestAutoFetch && externalReference && email && !simulatedStatus && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  Detectamos seu pedido. Quer buscar automaticamente?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoFetch}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Buscar agora
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSuggestAutoFetch(false)}
                  >
                    Agora não
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="externalReference">Número do Pedido</Label>
                <Input
                  id="externalReference"
                  type="text"
                  placeholder="BRAVOS-..."
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar Pedido
                  </>
                )}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {order && (
              <div className="space-y-4 mt-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Número do Pedido</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-2xl font-mono font-bold text-blue-900">
                          #{order.externalReference}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-blue-700 hover:bg-blue-100"
                          onClick={handleCopyRef}
                          aria-label="Copiar número do pedido"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 mr-1 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-700 mb-1">Status</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {getOrderStatusLabel(order.status)}
                      </p>
                      {getOrderStatusHint(order.status) && (
                        <p className="text-sm text-blue-600 mt-1">
                          {getOrderStatusHint(order.status)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Timeline: 4 etapas derivadas de order.status */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-3">Etapas do pedido</p>
                    <div className="flex flex-col gap-2">
                      {getTimeline(order.status).map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              step.state === 'done'
                                ? 'bg-green-500 border-green-500'
                                : step.state === 'current'
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'bg-gray-200 border-gray-300'
                            }`}
                            aria-hidden
                          >
                            {step.state === 'done' && (
                              <span className="text-white text-[10px] leading-none">✓</span>
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              step.state === 'done'
                                ? 'text-green-700'
                                : step.state === 'current'
                                  ? 'text-blue-900 font-medium'
                                  : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.status === 'FAILED_MONTINK' && (
                    <Alert className="mt-4 border-2 border-amber-500 bg-amber-50 [&_[data-slot=alert-description]]:text-amber-900">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      <AlertDescription>
                        <span className="font-semibold block mb-1">Problema no envio do pedido</span>
                        Nosso time foi notificado. Em breve entraremos em contato ou você pode falar conosco pelo suporte.
                      </AlertDescription>
                    </Alert>
                  )}

                  {(order.status === 'CANCELED' || order.status === 'FAILED') && (
                    <div className="mt-4 rounded-lg border border-gray-300 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-600" />
                        Precisa de ajuda?
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Se seu pedido foi cancelado ou não concluiu, entre em contato com nosso suporte.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href="mailto:suporte@bravosbrasil.com.br" target="_blank" rel="noopener noreferrer">
                          Falar com suporte
                        </a>
                      </Button>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleRefreshStatus}
                    disabled={refreshing || simulatedStatus !== null}
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Atualizar status
                  </Button>
                </div>

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

                  {order.montinkOrderId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Código de envio</p>
                      <p className="text-xs font-mono text-gray-600">{order.montinkOrderId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-gray-600" />
                Ajuda rápida
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium">Onde encontro o número do pedido?</span>
                  <span className="block text-gray-600">No e-mail de confirmação e na tela de pagamento.</span>
                </li>
                <li>
                  <span className="font-medium">Meu pagamento está pendente.</span>
                  <span className="block text-gray-600">Pode levar alguns minutos para atualizar após o pagamento.</span>
                </li>
                <li>
                  <span className="font-medium">O e-mail precisa ser o mesmo da compra?</span>
                  <span className="block text-gray-600">Sim, por segurança.</span>
                </li>
                <li>
                  <span className="font-medium">Atualização do status</span>
                  <span className="block text-gray-600">Use &quot;Atualizar status&quot; se acabou de pagar.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar para a Loja
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
