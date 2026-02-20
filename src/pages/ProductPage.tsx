import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import {
  ShoppingCart,
  ChevronLeft,
  Share2,
  Sparkles,
  TrendingUp,
  Ruler,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Header } from '@/sections/Header';
import { ProductHero } from '@/sections/ProductHero';
import { Footer } from '@/sections/Footer';
import { TrustBadges } from '@/components/TrustBadges';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { CartProvider, useCart } from '@/hooks/useCart';
import { MercadoPagoProvider } from '@/components/MercadoPagoProvider';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { fetchCatalogProductBySlug } from '@/services/catalog';
import { pickModelImage } from '@/utils/productImages';
import {
  getAvailableColors,
  getAvailableSizesFor,
  getAllProductSizes,
  isVariantAvailable,
  type BinaryGender,
} from '@/utils/productStock';
import type { Product } from '@/types';
import { JsonLd } from '@/components/JsonLd';

/* ══════════════════════════════════════════════════════════
   LOADING SKELETON
   ══════════════════════════════════════════════════════════ */
function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="w-full h-[520px] rounded-2xl" />

        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-12" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   NOT FOUND VIEW
   ══════════════════════════════════════════════════════════ */
function ProductNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="font-display text-4xl text-gray-900">
          Produto não encontrado
        </h1>
        <p className="font-body text-gray-500 text-lg max-w-md mx-auto">
          O produto que você está procurando pode ter sido removido ou não está mais disponível.
        </p>
        <Link to="/catalogo">
          <Button className="bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display text-lg px-8 py-6">
            <ChevronLeft className="w-5 h-5 mr-2" />
            VOLTAR AO CATÁLOGO
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT LOADER — keyed by slug, remounts on slug change
   ══════════════════════════════════════════════════════════ */
function ProductLoader({ slug }: { slug: string }) {
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [uiGender, setUiGender] = useState<BinaryGender>('masculino');
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Scroll to top on mount (component remounts per slug via key)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch product — setState inside .then() callback (async, not sync in effect body)
  useEffect(() => {
    let cancelled = false;

    fetchCatalogProductBySlug(slug).then(({ product: fetched }) => {
      if (cancelled) return;

      if (!fetched) {
        setNotFound(true);
      } else {
        setProduct(fetched);
        if (fetched.gender === 'feminino') setUiGender('feminino');
        else setUiGender('masculino');
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [slug]);

  // GA4 + Meta Pixel — view_item / ViewContent when product loads
  useEffect(() => {
    if (!product) return;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_item', {
        currency: 'BRL',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
        }],
      });
    }

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        value: product.price,
        currency: 'BRL',
      });
    }
  }, [product?.id]);

  // Derive colors and sizes from colorStock (or fallback)
  const colorOptions = useMemo(
    () => (product ? getAvailableColors(product) : []),
    [product],
  );

  const allSizes = useMemo(
    () => (product ? getAllProductSizes(product) : []),
    [product],
  );

  const availableSizes = useMemo(
    () =>
      product && selectedColor
        ? getAvailableSizesFor(product, selectedColor, uiGender)
        : [],
    [product, selectedColor, uiGender],
  );

  // Pick the best image based on gender preference
  const imageUrl = useMemo(() => {
    if (!product) return null;

    // 1. Se tem cor selecionada, tenta usar a foto específica daquela cor no colorStock
    if (selectedColor && Array.isArray(product.colorStock) && product.colorStock.length > 0) {
      const colorItem = product.colorStock.find((cs) => cs.id === selectedColor);
      if (colorItem?.image) return colorItem.image;
    }

    // 2. Fallback: foto de modelo pelo gênero (comportamento original)
    return pickModelImage(product, uiGender);
  }, [product, uiGender, selectedColor]);

  // Handle color change — resets size (same as ProductDialog pattern)
  const handleColorChange = (val: string) => {
    setSelectedColor(val);
    setSelectedSize('');
  };

  // Handle gender toggle — clears size if it becomes unavailable
  const handleGenderToggle = (g: BinaryGender) => {
    setUiGender(g);
    if (selectedSize && product && selectedColor) {
      const newSizes = getAvailableSizesFor(product, selectedColor, g);
      if (newSizes.length > 0 && !newSizes.includes(selectedSize)) {
        setSelectedSize('');
      }
    }
  };

  // SEO Meta Tags (uses product.metaTitle/metaDescription when available)
  useSEO({
    title: product?.metaTitle || (product ? `${product.name} | GEEKERIA` : 'Carregando... | GEEKERIA'),
    description: product?.metaDescription || product?.description || '',
    canonical: product ? `/produto/${product.slug ?? slug}` : undefined,
    ogImage: imageUrl || undefined,
    ogType: 'product',
  });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProductSkeleton />
        <Footer />
      </div>
    );
  }

  // ── Not found state ──
  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProductNotFound />
        <Footer />
      </div>
    );
  }

  const hasColorStock = Array.isArray(product.colorStock) && product.colorStock.length > 0;
  const isUnissex = product.gender === 'unissex';

  const canAdd =
    !!selectedColor &&
    !!selectedSize &&
    (!hasColorStock || isVariantAvailable(product, selectedColor, selectedSize, uiGender));

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast.error('Selecione o tamanho e a cor');
      return;
    }
    if (hasColorStock && !isVariantAvailable(product, selectedColor, selectedSize, uiGender)) {
      toast.error('Combinação indisponível no momento');
      return;
    }
    addToCart(product, 1, selectedSize, selectedColor);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatInstallment = (price: number) =>
    (price / 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Veja este produto: ${product.name} - ${formatPrice(product.price)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      );
      toast.success('Link copiado!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {product && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "image": imageUrl,
          "sku": product.id,
          "brand": {
            "@type": "Brand",
            "name": "GEEKERIA"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://bravosbrasil.com.br/produto/${product.slug}`,
            "priceCurrency": "BRL",
            "price": product.price,
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "GEEKERIA"
            }
          }
        }} />
      )}
      {product && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Início",
              "item": "https://bravosbrasil.com.br"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Catálogo",
              "item": "https://bravosbrasil.com.br/catalogo"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.name,
              "item": `https://bravosbrasil.com.br/produto/${product.slug}`
            }
          ]
        }} />
      )}
      <Header />
      <ProductHero productName={product.name} category={product.category} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* ── Left Column: Image ── */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-white">
              <img
                src={imageUrl ?? undefined}
                alt={product.name}
                className="w-full object-contain"
                style={{ aspectRatio: '3/4', maxHeight: '600px' }}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-[#7C3AED] text-white font-body text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    NOVO
                  </Badge>
                )}
                {product.isBestseller && (
                  <Badge className="bg-[#F59E0B] text-[#2563EB] font-body text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    MAIS VENDIDO
                  </Badge>
                )}
              </div>
            </div>

            {/* Gender toggle (unissex only) */}
            {isUnissex && (
              <div className="flex items-center justify-center gap-2 bg-white rounded-xl border border-gray-100 p-3">
                <span className="font-body text-sm text-gray-500 mr-2">Modelo:</span>
                <button
                  onClick={() => handleGenderToggle('masculino')}
                  className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
                    uiGender === 'masculino'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  &#9794; Masculino
                </button>
                <button
                  onClick={() => handleGenderToggle('feminino')}
                  className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
                    uiGender === 'feminino'
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  &#9792; Feminino
                </button>
              </div>
            )}
          </div>

          {/* ── Right Column: Details ── */}
          <div className="space-y-6">
            {/* Title + Share */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-4xl text-[#7C3AED]">
                {product.name}
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="shrink-0 mt-1"
              >
                <Share2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
            </div>

            {/* Price */}
            <div>
              <p className="font-display text-4xl text-[#7C3AED]">
                {formatPrice(product.price)}
              </p>
              <p className="text-sm text-gray-500 font-body mt-1">
                ou 3x de {formatInstallment(product.price)} sem juros
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-600 font-body leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>

            {/* ── Color selector ── */}
            <div>
              <Label className="font-body font-medium mb-2 block">Cor</Label>
              <RadioGroup
                value={selectedColor}
                onValueChange={handleColorChange}
                className="flex flex-wrap gap-2"
              >
                {colorOptions.map((co) => (
                  <div key={co.id}>
                    <RadioGroupItem
                      value={co.id}
                      id={`pdp-color-${co.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`pdp-color-${co.id}`}
                      className="flex items-center gap-2 px-3 py-2 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#7C3AED] peer-data-[state=checked]:bg-[#7C3AED]/10 hover:bg-gray-100 transition-colors font-body capitalize"
                    >
                      {co.hex && (
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: co.hex }}
                        />
                      )}
                      {co.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* ── Size selector ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-body font-medium">
                  Tamanho
                  {selectedColor && hasColorStock && availableSizes.length > 0 && (
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      {uiGender === 'masculino' ? '— corte masculino' : '— corte feminino'}
                    </span>
                  )}
                  {selectedColor && hasColorStock && availableSizes.length === 0 && (
                    <span className="text-xs text-red-500 ml-2 font-normal">
                      Sem estoque para essa cor
                    </span>
                  )}
                </Label>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline font-body"
                >
                  <Ruler className="w-3 h-3" />
                  Guia de tamanhos
                </button>
              </div>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className="flex flex-wrap gap-2"
              >
                {allSizes.map((size) => {
                  const disabled = hasColorStock && selectedColor
                    ? !availableSizes.includes(size)
                    : false;
                  return (
                    <div key={size}>
                      <RadioGroupItem
                        value={size}
                        id={`pdp-size-${size}`}
                        className="peer sr-only"
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={`pdp-size-${size}`}
                        className={`flex items-center justify-center w-12 h-12 border-2 rounded-md transition-colors font-body text-sm
                          ${disabled
                            ? 'opacity-30 cursor-not-allowed line-through'
                            : 'cursor-pointer hover:bg-gray-100 peer-data-[state=checked]:border-[#7C3AED] peer-data-[state=checked]:bg-[#7C3AED] peer-data-[state=checked]:text-white'
                          }`}
                      >
                        {size}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {!selectedColor && (
                <p className="text-xs text-gray-400 mt-1">
                  Selecione uma cor para ver os tamanhos disponíveis
                </p>
              )}
            </div>

            {/* Desktop CTA */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAdd}
              className="hidden md:flex w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              ADICIONAR AO CARRINHO
            </Button>

            {/* Trust signals */}
            <TrustBadges variant="pdp" />
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 md:hidden z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <Button
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          COMPRAR &mdash; {formatPrice(product.price)}
        </Button>
      </div>

      <Footer />
      <FloatingWhatsApp />

      {/* Modal guia de tamanhos */}
      <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Guia de Tamanhos</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 font-body text-sm">

            {/* Masculino */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">♂ Masculino (cm)</h3>
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2"></th>
                    <th className="border border-gray-200 px-3 py-2">PP</th>
                    <th className="border border-gray-200 px-3 py-2">P</th>
                    <th className="border border-gray-200 px-3 py-2">M</th>
                    <th className="border border-gray-200 px-3 py-2">G</th>
                    <th className="border border-gray-200 px-3 py-2">GG</th>
                    <th className="border border-gray-200 px-3 py-2">XG</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-left">Largura</td>
                    <td className="border border-gray-200 px-3 py-2">44-48</td>
                    <td className="border border-gray-200 px-3 py-2">46-50</td>
                    <td className="border border-gray-200 px-3 py-2">48-52</td>
                    <td className="border border-gray-200 px-3 py-2">53-57</td>
                    <td className="border border-gray-200 px-3 py-2">56-60</td>
                    <td className="border border-gray-200 px-3 py-2">59-63</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium text-left">Comprimento</td>
                    <td className="border border-gray-200 px-3 py-2">63-67</td>
                    <td className="border border-gray-200 px-3 py-2">65-69</td>
                    <td className="border border-gray-200 px-3 py-2">67-71</td>
                    <td className="border border-gray-200 px-3 py-2">69-73</td>
                    <td className="border border-gray-200 px-3 py-2">72-76</td>
                    <td className="border border-gray-200 px-3 py-2">73-77</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Feminino */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">♀ Feminino (cm)</h3>
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2"></th>
                    <th className="border border-gray-200 px-3 py-2">PP</th>
                    <th className="border border-gray-200 px-3 py-2">P</th>
                    <th className="border border-gray-200 px-3 py-2">M</th>
                    <th className="border border-gray-200 px-3 py-2">G</th>
                    <th className="border border-gray-200 px-3 py-2">GG</th>
                    <th className="border border-gray-200 px-3 py-2">XG</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-left">Largura</td>
                    <td className="border border-gray-200 px-3 py-2">38-42</td>
                    <td className="border border-gray-200 px-3 py-2">40-44</td>
                    <td className="border border-gray-200 px-3 py-2">42-46</td>
                    <td className="border border-gray-200 px-3 py-2">46-50</td>
                    <td className="border border-gray-200 px-3 py-2">50-54</td>
                    <td className="border border-gray-200 px-3 py-2">53-57</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium text-left">Comprimento</td>
                    <td className="border border-gray-200 px-3 py-2">58-62</td>
                    <td className="border border-gray-200 px-3 py-2">60-64</td>
                    <td className="border border-gray-200 px-3 py-2">62-66</td>
                    <td className="border border-gray-200 px-3 py-2">64-68</td>
                    <td className="border border-gray-200 px-3 py-2">67-71</td>
                    <td className="border border-gray-200 px-3 py-2">69-73</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400">
              * Medidas em centímetros. Encolhimento estimado: 4–7% no comprimento e 3–5% na largura após lavagem.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT CONTENT — routes slug to loader (or 404)
   ══════════════════════════════════════════════════════════ */
function ProductContent() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProductNotFound />
        <Footer />
      </div>
    );
  }

  // key={slug} ensures full remount when navigating between products
  return <ProductLoader key={slug} slug={slug} />;
}

/* ══════════════════════════════════════════════════════════
   PAGE WRAPPER (providers — same pattern as CatalogPage)
   ══════════════════════════════════════════════════════════ */
export default function ProductPage() {
  return (
    <MercadoPagoProvider>
      <CartProvider>
        <ProductContent />
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </MercadoPagoProvider>
  );
}
