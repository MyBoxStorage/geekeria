import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { AuthModal } from './AuthModal';
import { ProductSelector } from './ProductSelector';
import { apiConfig } from '../config/api';
import { Sparkles, MessageCircle, Clock, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = apiConfig.baseURL;
const WHATSAPP_NUMBER = '5524981313689';

const EXEMPLOS = {
  upload: '/assets/exemplo-upload.jpg',
  prompt: '/assets/exemplo-prompt.jpg',
  estampa: '/assets/exemplo-estampa.jpg',
};

export function GeradorEstampas() {
  const { user, token, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [lastGenerationId, setLastGenerationId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (máx 5MB)');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedPreview((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
    setError('');
  };

  const handleGenerate = async () => {
    if (!user || !token) {
      setShowAuthModal(true);
      return;
    }

    if (user.credits < 1) {
      setError('Você não tem créditos! Compre um produto para ganhar +5 gerações.');
      return;
    }

    if (prompt.length < 10) {
      setError('Descreva sua estampa com mais detalhes (mínimo 10 caracteres)');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedImage('');

    try {
      const body: Record<string, unknown> = { prompt };

      if (uploadedFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) ?? '');
          reader.readAsDataURL(uploadedFile);
        });
        body.uploadedImage = base64;
      }

      const res = await fetch(`${API_URL}/api/generate-stamp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar estampa');
      }

      setGeneratedImage(data.image);
      setExpiresAt(data.expiresAt ?? '');
      setLastGenerationId(data.generationId ?? null);
      await refreshUser();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const message = 'Olá! Gerei uma estampa personalizada e gostaria de fazer um pedido!';
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* COMO FUNCIONA */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="font-bold text-lg mb-4">COMO FUNCIONA</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">Envie sua foto (opcional)</p>
                  <div className="w-full h-36 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={EXEMPLOS.upload}
                      alt="Exemplo de upload"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">Descreva a estampa</p>
                  <div className="w-full h-36 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={EXEMPLOS.prompt}
                      alt="Exemplo de prompt"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">Gere com IA</p>
                  <div className="w-full h-36 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={EXEMPLOS.estampa}
                      alt="Exemplo de estampa gerada"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GERADOR */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              CRIE SUA ESTAMPA EXCLUSIVA
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Personalize com Inteligência Artificial
            </p>

            {user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 font-semibold text-sm">
                  💳 Créditos: {user.credits}/5
                </p>
                {user.credits === 0 && (
                  <p className="text-green-600 text-xs mt-1">
                    Compre um produto para ganhar +5 créditos
                  </p>
                )}
              </div>
            )}

            {/* Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                📷 Upload de Foto (Opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="w-full text-sm"
              />
              {uploadedPreview && (
                <img
                  src={uploadedPreview}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-32 object-cover"
                />
              )}
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                ✍️ Descreva sua estampa ideal
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={4}
                placeholder="Exemplo: Uma águia rasgando uma bandeira vermelha, com a frase 'LIBERDADE' em dourado"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {prompt.length}/500 caracteres
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">❌ {error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || (!!user && user.credits < 1)}
              size="lg"
              className="w-full bg-gradient-green-yellow text-[#002776] hover:opacity-90 font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105 hover:shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'GERANDO...' : 'GERAR ESTAMPA COM IA'}
            </Button>

            {/* Botões fixos - sempre visíveis */}
            <div className="flex gap-4 mt-4">
              <Button
                asChild
                size="lg"
                className="flex-1 bg-[#002776] hover:bg-[#001F5C] text-white font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105"
              >
                <Link to="/minhas-estampas" className="flex items-center justify-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  MINHAS ESTAMPAS
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="flex-1 border-2 border-[#00843D] text-[#00843D] hover:bg-[#00843D] hover:text-white font-display text-lg px-8 py-6 rounded-full transition-all"
              >
                <a
                  href="https://wa.me/5524981313689?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20as%20estampas%20personalizadas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  DÚVIDAS
                </a>
              </Button>
            </div>

            {!user && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Faça login para gerar estampas
              </p>
            )}
          </div>

          {/* RESULTADO */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="font-bold text-lg mb-4">SUA ESTAMPA</h3>

            {generatedImage ? (
              <>
                <img
                  src={generatedImage}
                  alt="Estampa gerada"
                  className="w-full rounded-lg border-2 border-green-500 mb-4"
                />

                {expiresAt && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <Clock size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-800 text-xs">
                      ⚠️ Esta imagem fica disponível por <strong>7 dias</strong> e será
                      apagada em {new Date(expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleWhatsApp}
                    size="lg"
                    className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    FAZER PEDIDO NO WHATSAPP
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full border-2 border-[#002776] text-[#002776] hover:bg-[#002776] hover:text-white font-display text-lg px-8 py-6 rounded-full transition-all"
                  >
                    <Link to="/minhas-estampas" className="flex items-center justify-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      VER TODAS MINHAS ESTAMPAS
                    </Link>
                  </Button>
                </div>

                {generatedImage && lastGenerationId && (
                  <div className="mt-6">
                    <ProductSelector
                      generationId={lastGenerationId}
                      onAddToCart={(data) => {
                        addToCart(data.product, data.quantity, data.size, data.color);

                        const cartExtras = JSON.parse(
                          localStorage.getItem('cartExtras') || '{}'
                        );
                        const itemKey = `${data.product.id}-${data.size}-${data.color}`;
                        cartExtras[itemKey] = {
                          generationId: data.generationId,
                          couponCode: data.couponCode,
                          discount: data.discount,
                        };
                        localStorage.setItem('cartExtras', JSON.stringify(cartExtras));

                        alert(`✅ ${data.product.name} adicionado ao carrinho!`);
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-400">Sua estampa aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signup"
      />
    </section>
  );
}
