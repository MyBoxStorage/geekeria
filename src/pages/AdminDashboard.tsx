/**
 * Painel Admin mínimo para operação manual Montink
 *
 * Rota: /admin
 *
 * ⚠️ IMPORTANTE:
 * - ADMIN_TOKEN fica apenas em memória (estado React)
 * - Nunca é salvo em localStorage/sessionStorage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Shield,
  RefreshCcw,
  FileJson,
  Eye,
  CheckCircle2,
  Loader2,
  Home,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import {
  fetchAdminOrders,
  exportAdminOrder,
  markMontinkAdmin,
  type AdminOrderSummary,
} from '@/services/admin';
import { handleAdminApiError } from '@/utils/adminErrors';
import { clearAdminToken } from '@/hooks/useAdminAuth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState<any | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderSummary | null>(null);
  const [montinkOrderId, setMontinkOrderId] = useState('');
  const [montinkStatus, setMontinkStatus] = useState('created');
  const [markLoading, setMarkLoading] = useState(false);

  const handleLoadOrders = async () => {
    if (!token) {
      toast.error('Informe o ADMIN_TOKEN');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAdminOrders(token);
      setOrders(response.orders);
      toast.success(`Carregado(s) ${response.count} pedido(s) READY_FOR_MONTINK`);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Erro ao carregar pedidos admin:', error);
      const err = handleAdminApiError(error);
      if (err.shouldClearToken) clearAdminToken();
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyExport = async (order: AdminOrderSummary) => {
    if (!token) {
      toast.error('Informe o ADMIN_TOKEN');
      return;
    }

    if (!confirm('Atenção: este JSON pode conter dados pessoais (nome, telefone, endereço). Deseja copiar mesmo assim?')) return;

    try {
      const data = await exportAdminOrder(token, order.externalReference);
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success(`JSON copiado para o pedido ${order.externalReference}`);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Erro ao exportar pedido:', error);
      const err = handleAdminApiError(error);
      if (err.shouldClearToken) clearAdminToken();
      toast.error(err.message);
    }
  };

  const handleOpenExportDialog = async (order: AdminOrderSummary) => {
    if (!token) {
      toast.error('Informe o ADMIN_TOKEN');
      return;
    }

    setExportLoading(true);
    try {
      const data = await exportAdminOrder(token, order.externalReference);
      setExportData(data);
      setExportDialogOpen(true);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Erro ao exportar pedido:', error);
      const err = handleAdminApiError(error);
      if (err.shouldClearToken) clearAdminToken();
      toast.error(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleOpenMarkDialog = (order: AdminOrderSummary) => {
    setSelectedOrder(order);
    setMontinkOrderId('');
    setMontinkStatus('created');
    setMarkDialogOpen(true);
  };

  const handleConfirmMark = async () => {
    if (!token) {
      toast.error('Informe o ADMIN_TOKEN');
      return;
    }

    if (!selectedOrder) return;

    if (!montinkOrderId || !montinkStatus) {
      toast.error('Preencha Montink Order ID e Status');
      return;
    }

    setMarkLoading(true);
    try {
      await markMontinkAdmin(token, selectedOrder.externalReference, {
        montinkOrderId,
        montinkStatus,
      });

      setOrders((prev) =>
        prev.filter((o) => o.externalReference !== selectedOrder.externalReference)
      );

      toast.success(`Pedido ${selectedOrder.externalReference} marcado como enviado`);
      setMarkDialogOpen(false);
      setSelectedOrder(null);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Erro ao marcar Montink:', error);
      const err = handleAdminApiError(error);
      if (err.shouldClearToken) clearAdminToken();
      toast.error(err.message);
    } finally {
      setMarkLoading(false);
    }
  };

  const handleCopyExportData = async () => {
    if (!exportData) return;
    if (!confirm('Atenção: este JSON pode conter dados pessoais (nome, telefone, endereço). Deseja copiar mesmo assim?')) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast.success('JSON copiado para área de transferência');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Erro ao copiar JSON:', error);
      toast.error('Erro ao copiar JSON');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-slate-800" />
              <span>Painel Admin - Montink Manual</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/generations')}
              >
                Gerações
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/prompts')}
              >
                Prompts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/coupons')}
              >
                Cupons
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="adminToken">ADMIN_TOKEN</Label>
                <Input
                  id="adminToken"
                  type="password"
                  placeholder="Informe o token administrativo"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <div className="flex gap-2 md:justify-end">
                <Button
                  type="button"
                  onClick={handleLoadOrders}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Carregar pedidos
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Somente pedidos com status <code>READY_FOR_MONTINK</code> serão listados. Use este
              painel apenas em ambiente seguro.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Pedidos READY_FOR_MONTINK</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum pedido carregado. Informe o token e clique em &quot;Carregar pedidos&quot;.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="px-3 py-2 border-b">Pedido</th>
                      <th className="px-3 py-2 border-b">Criado em</th>
                      <th className="px-3 py-2 border-b">Total</th>
                      <th className="px-3 py-2 border-b">Itens</th>
                      <th className="px-3 py-2 border-b">Cidade/UF</th>
                      <th className="px-3 py-2 border-b">Pagamento</th>
                      <th className="px-3 py-2 border-b">Risco</th>
                      <th className="px-3 py-2 border-b">Cliente</th>
                      <th className="px-3 py-2 border-b text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId} className="border-b last:border-b-0">
                        <td className="px-3 py-2 align-top font-mono text-xs">
                          {order.externalReference}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {new Date(order.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 align-top text-xs font-semibold">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {order.itemCount}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {order.shippingCity || '-'} / {order.shippingState || '-'}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {order.mpStatus || '-'}
                          {order.mpPaymentId && (
                            <div className="font-mono text-[10px] text-slate-500">
                              {order.mpPaymentId}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-xs">
                          {order.riskFlag ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-red-800">
                              <span>⚠️ RISCO</span>
                              <span className="font-medium">Risco {order.riskScore ?? 0}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {order.payerEmailMasked || '-'}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-right">
                          <div className="flex flex-col gap-1 items-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyExport(order)}
                            >
                              <FileJson className="w-3 h-3 mr-1" />
                              Copiar export
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenExportDialog(order)}
                              disabled={exportLoading}
                            >
                              {exportLoading ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Eye className="w-3 h-3 mr-1" />
                              )}
                              Ver detalhes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenMarkDialog(order)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Marcar Montink
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalhes / export */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export JSON - Pedido</DialogTitle>
          </DialogHeader>
          {exportData?.risk != null && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
              <h4 className="font-semibold text-slate-900 mb-2">Risco</h4>
              <dl className="grid grid-cols-1 gap-1 text-slate-700">
                <div><span className="font-medium">Score:</span> {exportData.risk.score ?? '-'}</div>
                <div>
                  <span className="font-medium">Motivos:</span>{' '}
                  {exportData.risk.reasons
                    ? exportData.risk.reasons
                        .split(/[;,]/)
                        .map((r: string) => r.trim())
                        .filter(Boolean)
                        .map((reason: string, i: number) => (
                          <span key={i}>{i > 0 ? ', ' : ''}{reason}</span>
                        ))
                    : '-'}
                </div>
                <div><span className="font-medium">IP:</span> {exportData.risk.ipAddress ?? '-'}</div>
                <div>
                  <span className="font-medium">Navegador:</span>{' '}
                  {exportData.risk.userAgent
                    ? String(exportData.risk.userAgent).slice(0, 80) + (exportData.risk.userAgent.length > 80 ? '…' : '')
                    : '-'}
                </div>
              </dl>
            </div>
          )}
          <div className="max-h-[60vh] overflow-auto bg-slate-950 text-slate-50 rounded-md p-4 text-xs">
            <pre>{exportData ? JSON.stringify(exportData, null, 2) : 'Carregando...'}</pre>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCopyExportData}>
              Copiar JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de marcar Montink */}
      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Marcar Montink -{' '}
              {selectedOrder ? selectedOrder.externalReference : 'Nenhum pedido selecionado'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="montinkOrderId">Montink Order ID</Label>
              <Input
                id="montinkOrderId"
                value={montinkOrderId}
                onChange={(e) => setMontinkOrderId(e.target.value)}
                placeholder="ID do pedido na Montink"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="montinkStatus">Montink Status</Label>
              <Input
                id="montinkStatus"
                value={montinkStatus}
                onChange={(e) => setMontinkStatus(e.target.value)}
                placeholder="created, sent, em_producao..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleConfirmMark}
              disabled={markLoading}
            >
              {markLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

