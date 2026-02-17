import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Star,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CatalogHero } from '@/sections/CatalogHero';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { categories, sizes, colors } from '@/data/products';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { CartProvider } from '@/hooks/useCart';
import { MercadoPagoProvider } from '@/components/MercadoPagoProvider';
import { Toaster } from '@/components/ui/sonner';
import type { Product, Category, Size, Color, Gender, SortOption } from '@/types';

/* ── Analytics helper (safe - no-op if gtag unavailable) ── */
function trackEvent(eventName: string, params: Record<string, string>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', eventName, params);
  }
}

/* ── Dynamic category counts ── */
function useCategoryCounts(products: Product[]) {
  return useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);
}

/* ══════════════════════════════════════════════════════════
   FILTERS SIDEBAR
   ══════════════════════════════════════════════════════════ */
function FiltersContent({
  filters,
  setCategory,
  setGender,
  toggleSize,
  toggleColor,
  setPriceRange,
  clearFilters,
  hasActiveFilters,
  categoryCounts,
}: {
  filters: {
    category: Category;
    gender: '' | Gender;
    sizes: Size[];
    colors: Color[];
    priceRange: [number, number] | null;
  };
  setCategory: (cat: Category) => void;
  setGender: (gender: '' | Gender) => void;
  toggleSize: (size: Size) => void;
  toggleColor: (color: Color) => void;
  setPriceRange: (range: [number, number] | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  categoryCounts: Record<string, number>;
}) {
  return (
    <>
      {/* Clear all (only when filters active) */}
      {hasActiveFilters && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-sm text-[#00843D] hover:text-[#006633] px-0"
          >
            Limpar tudo
          </Button>
        </div>
      )}

      {/* CATEGORIA */}
      <div className="mb-6">
        <h3 className="font-display text-sm uppercase text-gray-700 mb-3 tracking-wide">
          CATEGORIA
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.category === cat.id}
                onCheckedChange={() => setCategory(cat.id as Category)}
                className="border-gray-300 data-[state=checked]:bg-[#00843D] data-[state=checked]:border-[#00843D]"
              />
              <span className="font-body text-sm text-gray-700">
                {cat.name} ({categoryCounts[cat.id] ?? 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* GENERO */}
      <div className="mb-6">
        <h3 className="font-display text-sm uppercase text-gray-700 mb-3 tracking-wide">
          GENERO
        </h3>
        <div className="flex flex-col gap-2">
          {([
            { id: '' as '' | Gender, label: 'Todos' },
            { id: 'masculino' as '' | Gender, label: 'Masculino' },
            { id: 'feminino' as '' | Gender, label: 'Feminino' },
            { id: 'unissex' as '' | Gender, label: 'Unissex' },
          ]).map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="gender"
                value={option.id}
                checked={filters.gender === option.id}
                onChange={() => setGender(option.id)}
                className="accent-[#00843D]"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#00843D] transition-colors font-body">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* TAMANHO */}
      <div className="mb-6">
        <h3 className="font-display text-sm uppercase text-gray-700 mb-3 tracking-wide">
          TAMANHO
        </h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size as Size)}
              className={`w-12 h-12 rounded-lg border-2 font-display text-sm transition-all duration-200 ${
                filters.sizes.includes(size as Size)
                  ? 'border-[#00843D] bg-[#00843D] text-white'
                  : 'border-gray-300 text-gray-700 hover:border-[#00843D]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* COR */}
      <div className="mb-6">
        <h3 className="font-display text-sm uppercase text-gray-700 mb-3 tracking-wide">
          COR
        </h3>
        <div className="space-y-2">
          {colors.map((color) => (
            <label
              key={color.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={filters.colors.includes(color.id as Color)}
                onCheckedChange={() => toggleColor(color.id as Color)}
                className="border-gray-300 data-[state=checked]:bg-[#00843D] data-[state=checked]:border-[#00843D]"
              />
              <span
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-body text-sm text-gray-700 capitalize">
                {color.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* FAIXA DE PRECO */}
      <div className="mb-6">
        <h3 className="font-display text-sm uppercase text-gray-700 mb-3 tracking-wide">
          FAIXA DE PREÇO
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Todos os preços', range: null },
            { label: 'Até R$ 60', range: [0, 60] as [number, number] },
            { label: 'R$ 60 - R$ 100', range: [60, 100] as [number, number] },
            {
              label: 'R$ 100 - R$ 150',
              range: [100, 150] as [number, number],
            },
            {
              label: 'Acima de R$ 150',
              range: [150, 9999] as [number, number],
            },
          ].map((price) => (
            <label
              key={price.label}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={
                  price.range === null
                    ? filters.priceRange === null
                    : filters.priceRange !== null &&
                      filters.priceRange[0] === price.range[0] &&
                      filters.priceRange[1] === price.range[1]
                }
                onCheckedChange={() => setPriceRange(price.range)}
                className="border-gray-300 data-[state=checked]:bg-[#00843D] data-[state=checked]:border-[#00843D]"
              />
              <span className="font-body text-sm text-gray-700">
                {price.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT CARD (with gender toggle — navigates to PDP)
   ══════════════════════════════════════════════════════════ */
function ProductCard({
  product,
  formatPrice,
  formatInstallment,
  selectedGender,
}: {
  product: Product;
  formatPrice: (n: number) => string;
  formatInstallment: (n: number) => string;
  selectedGender: string;
}) {
  const navigate = useNavigate();
  const modelImages = useMemo(() => {
    const imgs = product.images ?? [];
    return {
      masculino: imgs.find(
        (img) => img.type === 'model' && img.gender === 'masculino'
      ),
      feminino: imgs.find(
        (img) => img.type === 'model' && img.gender === 'feminino'
      ),
      default:
        imgs.find((img) => img.type === 'model') ?? imgs[0] ?? null,
    };
  }, [product.images]);

  const hasBothGenders = !!(modelImages.masculino && modelImages.feminino);

  const initialGender = useMemo(() => {
    if (!hasBothGenders) return 'default' as const;
    if (selectedGender === 'masculino') return 'masculino' as const;
    if (selectedGender === 'feminino') return 'feminino' as const;
    // eslint-disable-next-line react-hooks/purity
    return Math.random() > 0.5
      ? ('masculino' as const)
      : ('feminino' as const);
  }, [hasBothGenders, selectedGender]);

  const [currentGender, setCurrentGender] = useState<
    'masculino' | 'feminino' | 'default'
  >(initialGender);

  useEffect(() => {
    if (!hasBothGenders) return;
    if (selectedGender === 'masculino') setCurrentGender('masculino');
    else if (selectedGender === 'feminino') setCurrentGender('feminino');
  }, [selectedGender, hasBothGenders]);

  const handleToggleGender = useCallback(() => {
    if (!hasBothGenders) return;
    setCurrentGender((prev) =>
      prev === 'masculino' ? 'feminino' : 'masculino'
    );
  }, [hasBothGenders]);

  const currentImageUrl = useMemo(() => {
    if (
      currentGender === 'masculino' &&
      modelImages.masculino
    )
      return modelImages.masculino.url;
    if (
      currentGender === 'feminino' &&
      modelImages.feminino
    )
      return modelImages.feminino.url;
    if (modelImages.default) return modelImages.default.url;
    return product.image;
  }, [currentGender, modelImages, product.image]);

  const showGenderBadge =
    product.gender === 'unissex' && hasBothGenders;

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover-lift cursor-pointer"
      onClick={() => navigate(`/produto/${product.slug}`)}
    >
      {/* Image */}
      <div
        className="relative aspect-[3/4] overflow-hidden bg-gray-100"
        onMouseEnter={handleToggleGender}
      >
        <img
          src={currentImageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-[#00843D] text-white font-body text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              NOVO
            </Badge>
          )}
          {product.isBestseller && (
            <Badge className="bg-[#FFCC29] text-[#002776] font-body text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              MAIS VENDIDO
            </Badge>
          )}
        </div>

        {/* Gender badge (only for unissex with both photos) */}
        {showGenderBadge && (
          <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider transition-all ${
                currentGender === 'masculino'
                  ? 'bg-[#002776] text-white'
                  : 'bg-white/50 text-gray-500'
              }`}
            >
              &#9794;
            </span>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider transition-all ${
                currentGender === 'feminino'
                  ? 'bg-[#00843D] text-white'
                  : 'bg-white/50 text-gray-500'
              }`}
            >
              &#9792;
            </span>
          </div>
        )}

        {/* Mobile gender toggle button */}
        {showGenderBadge && (
          <button
            className="md:hidden absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleGender();
            }}
          >
            {currentGender === 'masculino'
              ? '\u2640 Ver feminino'
              : '\u2642 Ver masculino'}
          </button>
        )}

        {/* Hover hint (desktop only) */}
        {showGenderBadge && (
          <div className="hidden md:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 text-white text-[9px] px-2 py-1 rounded-full tracking-wider font-medium">
            passe o mouse
          </div>
        )}

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/produto/${product.slug}`);
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            COMPRAR
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#FFCC29] text-[#FFCC29]" />
            <span className="text-sm font-body text-gray-600">
              {product.rating}
            </span>
          </div>

          {/* Quick View HoverCard (desktop only) */}
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <button
                className="hidden md:flex items-center gap-1 text-xs text-gray-400 hover:text-[#00843D] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              className="w-72 p-0 overflow-hidden"
            >
              <img
                src={currentImageUrl}
                alt={product.name}
                loading="lazy"
                className="w-full h-40 object-cover"
              />
              <div className="p-3 space-y-1.5">
                <p className="font-body font-medium text-sm text-gray-900 line-clamp-1">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 font-body line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg text-[#00843D]">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-gray-400 font-body">
                    {product.sizes.length} tamanhos
                  </span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <h3 className="font-body font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-[#00843D] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl text-[#00843D]">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="text-sm text-gray-500 font-body mt-1">
          ou 3x {formatInstallment(product.price)}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CATALOG CONTENT
   ══════════════════════════════════════════════════════════ */
const PAGE_SIZE = 12;

function CatalogContent() {
  // ── Server-side filter state (sent as query params) ──
  const [category, _setCategory] = useState<Category>('all');
  const [gender, _setGender] = useState<'' | Gender>('');
  const [sortBy, _setSortBy] = useState<SortOption>('bestsellers');

  // ── Client-side filter state (applied on current page) ──
  const [selectedSizes, setSelectedSizes] = useState<Size[]>([]);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Reset page to 1 when server-side filters change (batched with the setter)
  const setCategory = useCallback((cat: Category) => { _setCategory(cat); setPage(1); }, []);
  const setGender = useCallback((g: '' | Gender) => { _setGender(g); setPage(1); }, []);
  const setSortBy = useCallback((s: SortOption) => { _setSortBy(s); setPage(1); }, []);

  const toggleSize = useCallback((size: Size) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  }, []);
  const toggleColor = useCallback((color: Color) => {
    setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]);
  }, []);

  const clearFilters = useCallback(() => {
    _setCategory('all');
    _setGender('');
    _setSortBy('bestsellers');
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange(null);
    setPage(1);
  }, []);

  // ── Server params → hook ──
  const serverParams = useMemo(() => ({
    category: category !== 'all' ? category : undefined,
    gender: gender || undefined,
    sort: sortBy,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }), [category, gender, sortBy, page]);

  const {
    products: serverProducts,
    pagination,
    isLoading: catalogLoading,
  } = useCatalogProducts(serverParams);

  // ── Hide products without slug (no PDP available) ──
  const publicProducts = useMemo(
    () => serverProducts.filter((p) => !!p.slug),
    [serverProducts],
  );

  // ── Client-side filtering (sizes, colors, priceRange only) ──
  const filteredProducts = useMemo(() => {
    let result = [...publicProducts];

    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((s) => selectedSizes.includes(s as Size)),
      );
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.colors.some((c) => selectedColors.includes(c as Color)),
      );
    }
    if (priceRange) {
      const [min, max] = priceRange;
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    return result;
  }, [publicProducts, selectedSizes, selectedColors, priceRange]);

  // ── Derived values ──
  const categoryCounts = useCategoryCounts(publicProducts);

  const hasClientFilters = selectedSizes.length > 0 || selectedColors.length > 0 || priceRange !== null;
  const hasServerFilters = category !== 'all' || gender !== '';
  const hasActiveFilters = hasServerFilters || hasClientFilters;

  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));
  const showingFrom = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, pagination.total);

  // Build filters object for FiltersContent
  const filters = useMemo(() => ({
    category,
    gender,
    sizes: selectedSizes,
    colors: selectedColors,
    priceRange,
  }), [category, gender, selectedSizes, selectedColors, priceRange]);

  // Scroll to grid top when page changes (not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    gridContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  /* 3: Analytics - track filter changes */
  useEffect(() => {
    if (category !== 'all') {
      trackEvent('filter_category', { category });
    }
  }, [category]);

  useEffect(() => {
    if (selectedSizes.length > 0) {
      trackEvent('filter_size', { sizes: selectedSizes.join(',') });
    }
  }, [selectedSizes]);

  useEffect(() => {
    if (selectedColors.length > 0) {
      trackEvent('filter_color', { colors: selectedColors.join(',') });
    }
  }, [selectedColors]);

  useEffect(() => {
    if (gender) {
      trackEvent('filter_gender', { gender });
    }
  }, [gender]);

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatInstallment = (price: number) =>
    (price / 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filterProps = {
    filters,
    setCategory,
    setGender,
    toggleSize,
    toggleColor,
    setPriceRange,
    clearFilters,
    hasActiveFilters,
    categoryCounts,
  };

  /* 1: SEO Meta Tags (native, no external dependency) */
  useEffect(() => {
    const prev = document.title;
    document.title = 'Catálogo Completo - Bravos Brasil | Moda Patriótica';

    const metas: HTMLMetaElement[] = [];
    const links: HTMLLinkElement[] = [];

    const setMeta = (attr: string, value: string, content: string) => {
      const el = document.createElement('meta');
      el.setAttribute(attr, value);
      el.content = content;
      document.head.appendChild(el);
      metas.push(el);
    };

    setMeta('name', 'description', 'Explore nossa coleção completa de roupas patrióticas brasileiras. +45 produtos com frete grátis. Camisetas, moletons, bonés e mais.');
    setMeta('property', 'og:title', 'Catálogo Bravos Brasil - Moda Patriótica');
    setMeta('property', 'og:description', 'Coleção completa de roupas patrióticas brasileiras. Camisetas, moletons, bonés e acessórios com frete grátis.');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', 'https://bravosbrasil.com.br/catalogo');

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = 'https://bravosbrasil.com.br/catalogo';
    document.head.appendChild(canonical);
    links.push(canonical);

    return () => {
      document.title = prev;
      metas.forEach((el) => el.remove());
      links.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Banner with GSAP parallax + fade */}
      <CatalogHero
        totalProducts={pagination.total}
        hasActiveFilters={hasActiveFilters}
        isLoading={catalogLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex gap-8">
          {/* SIDEBAR FILTROS - DESKTOP */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-28">
              <h2 className="font-display text-xl text-gray-900 mb-4">
                FILTROS
              </h2>
              <FiltersContent {...filterProps} />
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* Top Bar: Mobile Filters + Sort */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="lg:hidden flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="font-display text-sm">FILTROS</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 bg-[#00843D] rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-display text-xl">
                      FILTROS
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent {...filterProps} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop: active filters count */}
              <div className="hidden lg:flex items-center gap-3">
                <span className="font-body text-sm text-gray-500">
                  {catalogLoading && publicProducts.length === 0
                    ? 'Carregando…'
                    : hasClientFilters
                      ? `${filteredProducts.length} de ${publicProducts.length} produtos`
                      : `${publicProducts.length} produtos`}
                </span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm text-[#00843D]"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="font-body text-sm text-gray-600 hidden sm:block">
                  Ordenar por:
                </span>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortOption)}
                >
                  <SelectTrigger className="w-[180px] font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bestsellers">Mais vendidos</SelectItem>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="price-asc">Menor preço</SelectItem>
                    <SelectItem value="price-desc">Maior preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            <div ref={gridContainerRef}>
              {catalogLoading && publicProducts.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={`skel-${i}`} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                      <Skeleton className="aspect-[3/4] w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <p className="font-body text-lg text-gray-500 mb-4">
                    Nenhum produto encontrado com esses filtros.
                  </p>
                  <Button
                    onClick={clearFilters}
                    className="bg-[#00843D] hover:bg-[#006633] text-white font-display"
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      formatPrice={formatPrice}
                      formatInstallment={formatInstallment}
                      selectedGender={filters.gender}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.total > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 gap-4">
                <span className="text-sm text-gray-500 font-body">
                  Mostrando {showingFrom}–{showingTo} de {pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || catalogLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="font-display"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm font-body text-gray-600 tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || catalogLoading}
                    onClick={() => setPage((p) => p + 1)}
                    className="font-display"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE WRAPPER (providers)
   ══════════════════════════════════════════════════════════ */
export function CatalogPage() {
  return (
    <MercadoPagoProvider>
      <CartProvider>
        <CatalogContent />
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </MercadoPagoProvider>
  );
}
