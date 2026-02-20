import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiConfig } from '@/config/api';
import { authService } from '@/services/auth';
import { useSEO } from '@/hooks/useSEO';

const WHATSAPP_NUMBER = '5524981313689';

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: string;
  isExpired: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function MinhasEstampasPage() {
  useSEO({ title: 'Minhas Estampas | GEEKERIA', description: '', noindex: true });

  const { user, isLoading: authLoading } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchGenerations();
  }, [authLoading, user]);

  const fetchGenerations = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${apiConfig.baseURL}/api/user/my-generations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Erro ao buscar gerações');

      const data = await res.json();
      setGenerations(data.generations);
    } catch (error) {
      console.error('Erro ao buscar gerações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (prompt: string, generationId: string) => {
    const message = `Olá! Gostaria de fazer um pedido da estampa:\n\n📝 Prompt: ${prompt}\n🆔 ID: ${generationId}\n\n👤 Nome: ${user?.name || user?.email?.split('@')[0]}\n📧 Email: ${user?.email}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-ink-2 mb-4">
            Você precisa estar logado para ver suas estampas.
          </p>
          <Link
            to="/"
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎨 Minhas Estampas
        </h1>

        {generations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-ink-2 mb-4">
              Você ainda não gerou nenhuma estampa
            </p>
            <Link
              to="/"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Gerar minha primeira estampa →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="bg-surface rounded-lg shadow-lg overflow-hidden"
              >
                {gen.imageUrl && !gen.isExpired ? (
                  <img
                    src={gen.imageUrl}
                    alt="Estampa"
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-elevated flex items-center justify-center">
                    <span className="text-ink-3">
                      {gen.isExpired ? '⏰ Expirada' : 'Processando...'}
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <p className="text-sm text-ink-2 mb-2">
                    📝 {gen.prompt}
                  </p>

                  <p className="text-xs text-ink-3 mb-3">
                    Gerada em:{' '}
                    {new Date(gen.createdAt).toLocaleDateString('pt-BR')}
                  </p>

                  {!gen.isExpired && gen.expiresAt && (
                    <p className="text-xs text-red-600 mb-3">
                      ⏰ Expira em:{' '}
                      {new Date(gen.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {gen.status === 'COMPLETED' && !gen.isExpired && (
                    <button
                      onClick={() => handleWhatsApp(gen.prompt, gen.id)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📱 Fazer Pedido
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
