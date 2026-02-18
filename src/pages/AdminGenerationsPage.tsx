import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Download, RefreshCw } from 'lucide-react';
import { apiConfig } from '@/config/api';
import { getAdminToken, setAdminToken as persistAdminToken, clearAdminToken } from '@/hooks/useAdminAuth';
import { getAdminErrorMessage, isAdminAuthError } from '@/utils/adminErrors';

const API_URL = apiConfig.baseURL;

interface Generation {
  id: string;
  prompt: string;
  status: string;
  imageUrl: string;
  isExpired: boolean;
  expiresAt: string;
  createdAt: string;
  user: {
    email: string;
    name: string;
    phone: string;
  };
}

export function AdminGenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('COMPLETED');
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchGenerations = async () => {
    if (!adminToken) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/generations?status=${filter}&limit=100`,
        {
          headers: {
            'x-admin-token': adminToken,
          },
        }
      );

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      const data = await res.json();
      setGenerations(data.generations);
      setIsAuthenticated(true);
      persistAdminToken(adminToken);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching generations:', error);
      alert(getAdminErrorMessage());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = getAdminToken();
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (adminToken && isAuthenticated) {
      fetchGenerations();
    }
  }, [filter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGenerations();
  };

  const handleDownload = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Download error:', error);
      alert(getAdminErrorMessage());
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6">🔐 Admin Gerações</h1>
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">📊 Estampas Geradas</h1>
            <AdminNav />
          </div>

          <div className="flex gap-4 mb-6">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="COMPLETED">Completas</option>
              <option value="PENDING">Pendentes</option>
              <option value="FAILED">Falhas</option>
            </select>

            <button
              onClick={fetchGenerations}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Total: {generations.length} estampas
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                {gen.imageUrl && !gen.isExpired ? (
                  <img
                    src={gen.imageUrl}
                    alt="Estampa"
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">
                      {gen.isExpired ? 'Imagem expirada' : 'Sem imagem'}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Cliente:</div>
                    <div className="font-semibold">
                      {gen.user.name || gen.user.email}
                    </div>
                    <div className="text-sm text-gray-600">{gen.user.email}</div>
                    {gen.user.phone && (
                      <div className="text-sm text-gray-600">
                        📱 {gen.user.phone}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Prompt:</div>
                    <div className="text-sm line-clamp-2">{gen.prompt}</div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Gerado em:{' '}
                    {new Date(gen.createdAt).toLocaleString('pt-BR')}
                    <br />
                    {!gen.isExpired && gen.expiresAt && (
                      <>
                        Expira em:{' '}
                        {new Date(gen.expiresAt).toLocaleDateString('pt-BR')}
                      </>
                    )}
                  </div>

                  {gen.imageUrl && !gen.isExpired && (
                    <button
                      onClick={() =>
                        handleDownload(gen.imageUrl, `${gen.user.email}_${gen.id}.png`)
                      }
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Baixar Imagem
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
