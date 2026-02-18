import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Home, MapPin, Loader2, PackageSearch, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { getOrder } from '@/services/orders';
import type { OrderResponse } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { loadPendingCheckout, clearPendingCheckout } from '@/utils/pendingCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';

interface LegacyPending {
  externalReference?: string;
  email?: string;
}

export default function CheckoutSuccess() {
  useSEO({ title: 'Pedido Confirmado | BRAVOS BRASIL', description: '', noindex: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const queryRef = searchParams.get('external_reference') ?? searchParams.get('ref');

  // ── Recuperacao de referencia: query > V1 > legacy ──────────────────
  const pendingV1 = useMemo(() => loadPendingCheckout(), []);

  const resolvedRef = useMemo(() => {
    if (queryRef) return queryRef;
    if (pendingV1?.externalReference) return pendingV1.externalReference;
    try {
      const raw = localStorage.getItem('bb_order_pending');
      if (raw) {
        const parsed = JSON.parse(raw) as LegacyPending;
        if (parsed.externalReference) return parsed.externalReference;
      }
    } catch { /* ignore */ }
    return null;
  }, [queryRef, pendingV1]);

  const resolvedEmail = useMemo(() => {
    try {
      const raw = localStorage.getItem('bb_order_pending');
      if (raw) {
        const parsed = JSON.parse(raw) as LegacyPending;
        if (parsed.externalReference === resolvedRef && parsed.email) return parsed.email;
      }
    } catch { /* ignore */ }
    return pendingV1?.payer?.email ?? null;
  }, [resolvedRef, pendingV1]);

  // ── Limpeza segura: somente se temos referencia resolvida ───────────
  useEffect(() => {
    if (resolvedRef) {
      clearPendingCheckout();
      try { localStorage.removeItem('pixPaymentData'); } catch { /* ignore */ }
    }
  }, [resolvedRef]);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resolvedRef || !resolvedEmail) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const orderData = await getOrder(resolvedRef, resolvedEmail);
        setOrder(orderData);
      } catch {
        if (import.meta.env.DEV) console.error('Erro ao carregar detalhes do pedido');
        toast.error('Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [resolvedRef, resolvedEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00843D]/10 via-[#00843D]/5 to-[#FFCC29]/10 p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0 rounded-xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 text-center">
          {/* Ícone Principal com animação scale suave */}
          <div className="mb-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00843D]/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <CheckCircle className="w-20 h-20 sm:w-24 sm:h-24 text-[#00843D] relative z-10" />
            </div>
          </div>

          {/* Título com font-display (Bebas Neue) */}
          <h1 className="font-display text-3xl sm:text-4xl text-[#002776] mb-3 tracking-wide">
            Pagamento Aprovado
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-lg text-[#002776]/70 mb-6 sm:mb-8 font-body">
            Seu pedido foi confirmado. Voce pode acompanhar o status a qualquer momento.
          </p>

          {/* Badge de Status Aprovado */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-[#00843D]/15 text-[#00843D] border border-[#00843D]/30 rounded-full px-4 py-2 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Pagamento Confirmado
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#00843D]" />
            </div>
          ) : (
            <>
              {/* Card do Número do Pedido - com cores da marca */}
              {resolvedRef && (
                <div className="bg-gradient-to-r from-[#00843D]/10 to-[#00843D]/5 rounded-xl p-5 sm:p-6 mb-6 border border-[#00843D]/30 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#00843D]/10 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#00843D]" />
                    </div>
                    <p className="text-sm font-medium text-[#00843D] font-body">Referencia do pedido</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-[#002776]">
                    #{resolvedRef}
                  </p>
                </div>
              )}

              {/* Aviso quando não tem order - com amarelo da marca */}
              {!loading && resolvedRef && !order && (
                <div className="text-sm text-[#002776] bg-[#FFCC29]/10 border border-[#FFCC29]/30 rounded-xl p-4 mb-4 font-body">
                  Para acompanhar, use o botao abaixo e informe seu e-mail.
                </div>
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

              {/* Alerta "Próximos passos" - com verde da marca */}
              <div className="mb-6 p-4 sm:p-5 bg-[#00843D]/5 rounded-xl border border-[#00843D]/20">
                <p className="text-sm text-[#00843D] font-body leading-relaxed">
                  <strong className="font-semibold">Próximos passos:</strong> Estamos preparando seu pedido para envio.
                </p>
              </div>
            </>
          )}

          {/* Botões de Ação */}
          <div className="space-y-3">
            {resolvedRef ? (
              <Button
                className="w-full bg-[#00843D] hover:bg-[#006633] text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                size="lg"
                onClick={() => {
                  navigate(`/order?ref=${encodeURIComponent(resolvedRef)}`, {
                    state: { ref: resolvedRef, email: resolvedEmail ?? undefined },
                  });
                }}
                aria-label="Acompanhar meu pedido"
              >
                <PackageSearch className="w-4 h-4 mr-2" />
                ACOMPANHAR PEDIDO
              </Button>
            ) : (
              <p className="text-sm text-[#002776]/60 py-2 font-body">
                Pagamento confirmado. Se voce nao encontrar seu pedido, verifique seu e-mail.
              </p>
            )}

            <Link to="/minha-conta" className="block">
              <Button
                className="w-full border-2 border-[#002776] text-[#002776] hover:bg-[#002776] hover:text-white rounded-lg transition-all duration-300"
                size="lg"
                variant="outline"
              >
                <User className="w-4 h-4 mr-2" />
                {user ? 'IR PARA MINHA CONTA' : 'CRIAR CONTA PARA ACOMPANHAR'}
              </Button>
            </Link>

            <Link to="/catalogo" className="block">
              <Button
                className="w-full border-2 border-[#00843D] text-[#00843D] hover:bg-[#00843D] hover:text-white rounded-lg transition-all duration-300"
                size="lg"
                variant="outline"
                aria-label="Voltar ao catálogo"
              >
                <Home className="w-4 h-4 mr-2" />
                VOLTAR AO CATALOGO
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
                  resolvedRef
                    ? `Olá! Meu pagamento foi aprovado e quero acompanhar meu pedido. Referência: ${resolvedRef}. Pode me ajudar?`
                    : 'Olá! Meu pagamento foi aprovado e preciso de ajuda com meu pedido. Pode me ajudar?'
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
            Você receberá um e-mail de confirmação com os detalhes do pedido.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
