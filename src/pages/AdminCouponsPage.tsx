import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminNav } from '@/components/AdminNav';
import { apiConfig } from '@/config/api';
import { getAdminToken, setAdminToken, clearAdminToken } from '@/hooks/useAdminAuth';
import { getAdminErrorMessage, isAdminAuthError } from '@/utils/adminErrors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count?: { usages: number };
}

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminTokenState] = useState(() => getAdminToken() || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    maxUses: '',
    expiresAt: '',
  });

  useEffect(() => {
    const savedToken = getAdminToken();
    if (savedToken) {
      setAdminTokenState(savedToken);
      fetchCoupons(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCoupons = async (token?: string) => {
    const tokenToUse = token || adminToken;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/admin/coupons`, {
        headers: { 'x-admin-token': tokenToUse },
      });

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        setLoading(false);
        return;
      }

      const data = await res.json();
      setCoupons(data.coupons);
      setIsAuthenticated(true);
      setAdminToken(tokenToUse);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching coupons:', error);
      alert(getAdminErrorMessage());
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCoupons(adminToken);
  };

  const handleCreate = async () => {
    if (!newCoupon.code || newCoupon.value <= 0) {
      alert('Preencha código e valor válido');
      return;
    }

    if (newCoupon.type === 'PERCENTAGE' && newCoupon.value > 20) {
      alert('Desconto máximo: 20%');
      return;
    }

    try {
      const res = await fetch(`${apiConfig.baseURL}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          code: newCoupon.code,
          type: newCoupon.type,
          value: newCoupon.value,
          maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses, 10) : null,
          expiresAt: newCoupon.expiresAt || null,
        }),
      });

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      setNewCoupon({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        maxUses: '',
        expiresAt: '',
      });
      setShowCreateForm(false);
      fetchCoupons();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating coupon:', error);
      alert(getAdminErrorMessage());
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      fetchCoupons();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error toggling coupon:', error);
      alert(getAdminErrorMessage());
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) return;

    try {
      const res = await fetch(`${apiConfig.baseURL}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      fetchCoupons();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting coupon:', error);
      alert(getAdminErrorMessage());
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6">🎟️ Admin - Cupons</h1>
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium mb-2">Admin Token</label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminTokenState(e.target.value)}
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
          <p className="mt-4 text-center">
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar ao painel admin
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">🎟️ Gerenciar Cupons</h1>
            <div className="flex gap-4 items-center flex-wrap">
              <AdminNav />
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {showCreateForm ? 'Cancelar' : '+ Novo Cupom'}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
              <h2 className="text-xl font-bold mb-4">Criar Novo Cupom</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Código do Cupom
                  </label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: BEMVINDO10"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <Select
                    value={newCoupon.type}
                    onValueChange={(value) =>
                      setNewCoupon({
                        ...newCoupon,
                        type: value as 'PERCENTAGE' | 'FIXED',
                      })
                    }
                  >
                    <SelectTrigger className="w-full font-body h-10 rounded-lg border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-body">
                      <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Valor ({newCoupon.type === 'PERCENTAGE' ? '%' : 'R$'})
                  </label>
                  <input
                    type="number"
                    value={newCoupon.value || ''}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    max={newCoupon.type === 'PERCENTAGE' ? '20' : undefined}
                    step={newCoupon.type === 'PERCENTAGE' ? '1' : '0.01'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  {newCoupon.type === 'PERCENTAGE' && (
                    <p className="text-xs text-gray-500 mt-1">Máximo: 20%</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Limite de Usos (opcional)
                  </label>
                  <input
                    type="number"
                    value={newCoupon.maxUses}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, maxUses: e.target.value })
                    }
                    placeholder="Ilimitado"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Data de Expiração (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newCoupon.expiresAt}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, expiresAt: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Criar Cupom
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">Nenhum cupom criado ainda</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Criar Primeiro Cupom →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-lg shadow-lg p-6 ${
                  !coupon.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-green-600">
                        {coupon.code}
                      </h2>
                      {coupon.isActive ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          ATIVO
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          INATIVO
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Desconto:</span>
                        <span className="ml-2 font-semibold">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}%`
                            : `R$ ${coupon.value.toFixed(2)}`}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-600">Usos:</span>
                        <span className="ml-2 font-semibold">
                          {coupon.usedCount}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ' (ilimitado)'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-600">Criado:</span>
                        <span className="ml-2">
                          {new Date(coupon.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {coupon.expiresAt && (
                        <div>
                          <span className="text-gray-600">Expira:</span>
                          <span className="ml-2">
                            {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                      className={`px-4 py-2 rounded-lg ${
                        coupon.isActive
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {coupon.isActive ? 'Desativar' : 'Ativar'}
                    </button>

                    {coupon.usedCount === 0 && (
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Deletar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
