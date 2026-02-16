import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { apiConfig } from '@/config/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalUsers: number;
    totalGenerations: number;
    successfulGenerations: number;
    couponsUsed: number;
    totalDiscount: number;
  };
  salesByDay: Array<{ date: string; count: number; revenue: number }>;
  topProducts: Array<{ productName: string; totalSold: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
}

export function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setAdminToken(savedToken);
      fetchAnalytics(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = async (
    token?: string,
    start?: string,
    end?: string
  ) => {
    const tokenToUse = token || adminToken;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const res = await fetch(
        `${apiConfig.baseURL}/api/admin/analytics/overview?${params}`,
        {
          headers: { 'x-admin-token': tokenToUse },
        }
      );

      if (!res.ok) {
        alert('Token inválido');
        return;
      }

      const data = await res.json();
      setAnalytics(data.analytics);
      setIsAuthenticated(true);
      localStorage.setItem('admin_token', tokenToUse);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(adminToken);
  };

  const handleDateFilter = () => {
    fetchAnalytics(adminToken, dateRange.start, dateRange.end);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6">📊 Admin - Dashboard</h1>
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium mb-2">Admin Token</label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Digite o token de admin"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Carregando analytics...</div>
      </div>
    );
  }

  if (!analytics) return null;

  const COLORS = ['#00843D', '#FFD700', '#3B82F6', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">📊 Dashboard de Vendas</h1>
            <AdminNav />
          </div>

          {/* Filtro de data */}
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Fim</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Filtrar
            </button>
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' });
                fetchAnalytics(adminToken);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Cards de Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Receita Total</div>
            <div className="text-3xl font-bold text-green-600">
              R$ {analytics.overview.totalRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Pendente: R$ {analytics.overview.pendingRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Total de Pedidos</div>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.overview.totalOrders}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">
              Usuários Cadastrados
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.overview.totalUsers}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Estampas Geradas</div>
            <div className="text-3xl font-bold text-orange-600">
              {analytics.overview.successfulGenerations}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total: {analytics.overview.totalGenerations}
            </div>
          </div>
        </div>

        {/* Gráfico de Vendas por Dia */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            📈 Vendas dos Últimos 30 Dias
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                }
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                labelFormatter={(date) =>
                  new Date(date).toLocaleDateString('pt-BR')
                }
                formatter={(value: number, name: string) =>
                  name === 'revenue' ? `R$ ${value.toFixed(2)}` : value
                }
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                name="Pedidos"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#00843D"
                name="Receita (R$)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Produtos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">🏆 Top 10 Produtos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topProducts.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="productName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalSold" fill="#00843D" name="Vendidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status dos Pedidos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">📦 Status dos Pedidos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.ordersByStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cards de Cupons */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Cupons Utilizados</div>
            <div className="text-3xl font-bold text-yellow-600">
              {analytics.overview.couponsUsed}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">
              Desconto Total Concedido
            </div>
            <div className="text-3xl font-bold text-red-600">
              R$ {analytics.overview.totalDiscount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
