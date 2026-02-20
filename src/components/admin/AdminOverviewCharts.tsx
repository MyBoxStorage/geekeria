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

const COLORS = ['#7C3AED', '#FFD700', '#3B82F6', '#EF4444', '#8B5CF6'];

interface AdminOverviewChartsProps {
  salesByDay: Array<{ date: string; count: number; revenue: number }>;
  topProducts: Array<{ productName: string; totalSold: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
}

export default function AdminOverviewCharts({
  salesByDay,
  topProducts,
  ordersByStatus,
}: AdminOverviewChartsProps) {
  return (
    <>
      {/* Gráfico de Vendas por Dia */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">
          📈 Vendas dos Últimos 30 Dias
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesByDay}>
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
              stroke="#7C3AED"
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
            <BarChart data={topProducts.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="productName"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#7C3AED" name="Vendidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status dos Pedidos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">📦 Status dos Pedidos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.status}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {ordersByStatus.map((_, index) => (
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
    </>
  );
}
