import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import { apiConfig } from '@/config/api';
import {
  User,
  Package,
  Image,
  CreditCard,
  LogOut,
  Settings,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { pickOrderItemImage } from '@/utils/productImages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types matching backend responses
interface Generation {
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  isExpired: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  size: string | null;
  color: string | null;
  product: {
    name: string;
    image: string | null;
    images?: unknown[] | null;
    colorStock?: unknown[] | null;
  };
}

interface UserOrder {
  id: string;
  externalReference: string;
  total: number;
  status: string;
  mpStatus: string | null;
  paymentMethod: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  READY_FOR_MONTINK: { label: 'Preparando', color: 'bg-blue-100 text-blue-800' },
  SENT_TO_MONTINK: { label: 'Em Produção', color: 'bg-indigo-100 text-indigo-800' },
  FAILED_MONTINK: { label: 'Falha Produção', color: 'bg-red-100 text-red-800' },
  CANCELED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
  FAILED: { label: 'Falhou', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function useAuthFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${apiConfig.baseURL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── Sub-components ───────────────────────────────────────────────

function GenerationsGrid({ generations, loading, error, onRefresh }: {
  generations: Generation[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#00843D]" />
        <span className="ml-2 text-gray-600">Carregando estampas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma estampa ainda
        </h3>
        <p className="text-gray-600 mb-6">
          Crie sua primeira estampa personalizada com IA
        </p>
        <Link to="/">
          <Button>Criar Estampa</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{generations.length} estampa(s)</p>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {generations.map((gen) => (
          <div
            key={gen.id}
            className={`group relative rounded-xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow ${gen.isExpired ? 'opacity-60' : ''}`}
          >
            {gen.imageUrl ? (
              <img
                src={gen.imageUrl}
                alt={gen.prompt}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                {gen.status === 'PENDING' ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                )}
              </div>
            )}
            {gen.isExpired && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                Expirada
              </div>
            )}
            <div className="p-3">
              <p className="text-xs text-gray-600 line-clamp-2">{gen.prompt}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(gen.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {generations.length >= 6 && (
        <div className="mt-4 text-center">
          <Link to="/minhas-estampas">
            <Button variant="outline">
              Ver Todas as Estampas
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function OrdersList({ orders, loading, error, onRefresh }: {
  orders: UserOrder[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#00843D]" />
        <span className="ml-2 text-gray-600">Carregando pedidos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum pedido ainda
        </h3>
        <p className="text-gray-600 mb-6">
          Faça sua primeira compra na loja
        </p>
        <Link to="/">
          <Button>Ir para Loja</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{orders.length} pedido(s)</p>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-mono font-medium text-gray-900 truncate">
                    #{order.externalReference.slice(-8).toUpperCase()}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(order.createdAt)}
                  </span>
                  {order.paymentMethod && (
                    <span className="uppercase">{order.paymentMethod}</span>
                  )}
                  {order.shippingCity && order.shippingState && (
                    <span>{order.shippingCity}/{order.shippingState}</span>
                  )}
                </div>
                {order.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {order.items.map((item) => {
                      const thumb = pickOrderItemImage(item);
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.product.name}
                              className="w-8 h-8 rounded object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {item.product.name}{item.size ? ` (${item.size})` : ''}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </p>
                <Link to={`/order?ref=${order.externalReference}`}>
                  <Button variant="ghost" size="sm" className="mt-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Detalhes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────

export default function UserDashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: genData,
    loading: genLoading,
    error: genError,
    refetch: refetchGen,
  } = useAuthFetch<{ success: boolean; generations: Generation[] }>('/api/user/my-generations');

  const {
    data: ordData,
    loading: ordLoading,
    error: ordError,
    refetch: refetchOrd,
  } = useAuthFetch<{ success: boolean; orders: UserOrder[] }>('/api/user/my-orders?limit=10');

  const generations = genData?.generations ?? [];
  const orders = ordData?.orders ?? [];

  const recentGenerations = generations.slice(0, 6);
  const recentOrders = orders.slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#00843D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">Voltar para Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Minha Conta
              </h1>
              <p className="text-gray-600 mt-1">
                Olá, <span className="font-semibold text-[#00843D]">{user.name || user.email}</span>
              </p>
            </div>
            <Link to="/">
              <Button variant="outline">
                Voltar para Loja
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="stamps" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Estampas</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Credits */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="w-5 h-5 text-[#00843D]" />
                    Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-[#00843D]">{user.credits || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">disponíveis para gerar estampas</p>
                  <Link to="/">
                    <Button className="w-full mt-3" variant="outline" size="sm">
                      Comprar Mais
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Stamps count */}
              <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setActiveTab('stamps')}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Estampas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-600">
                    {genLoading ? '...' : generations.length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">estampas geradas com IA</p>
                </CardContent>
              </Card>

              {/* Orders count */}
              <Card className="cursor-pointer hover:border-purple-300 transition-colors" onClick={() => setActiveTab('orders')}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="w-5 h-5 text-purple-600" />
                    Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-600">
                    {ordLoading ? '...' : orders.length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">pedidos realizados</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Stamps Preview */}
            {recentGenerations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Estampas Recentes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('stamps')}>
                      Ver Todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {recentGenerations.map((gen) => (
                      <div key={gen.id} className="rounded-lg overflow-hidden border bg-gray-50">
                        {gen.imageUrl ? (
                          <img
                            src={gen.imageUrl}
                            alt={gen.prompt}
                            className="w-full aspect-square object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Orders Preview */}
            {recentOrders.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Pedidos Recentes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                      Ver Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-700">
                            #{order.externalReference.slice(-8).toUpperCase()}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Meus Pedidos */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>
                  Acompanhe o status de todas as suas compras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersList
                  orders={orders}
                  loading={ordLoading}
                  error={ordError}
                  onRefresh={refetchOrd}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Minhas Estampas */}
          <TabsContent value="stamps">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Estampas</CardTitle>
                <CardDescription>
                  Estampas geradas com IA exclusivas para você
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerationsGrid
                  generations={generations}
                  loading={genLoading}
                  error={genError}
                  onRefresh={refetchGen}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Configurações */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
                <CardDescription>
                  Gerencie suas preferências
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações da Conta</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    {user.name && (
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Créditos</p>
                      <p className="font-medium">{user.credits || 0} créditos disponíveis</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
