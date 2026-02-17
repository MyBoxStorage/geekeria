import { useState } from 'react';
import { Filter, Star, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { allProducts, categories, sizes, colors } from '@/data/products';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCart } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { CartProvider } from '@/hooks/useCart';
import { MercadoPagoProvider } from '@/components/MercadoPagoProvider';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { Product, Category, Size, Color, SortOption } from '@/types';

function FiltersContent({
  filters,
  setCategory,
  toggleSize,
  toggleColor,
  setPriceRange,
  clearFilters,
  hasActiveFilters,
}: {
  filters: { category: Category; sizes: Size[]; colors: Color[]; priceRange: [number, number] | null };
  setCategory: (cat: Category) => void;
  toggleSize: (size: Size) => void;
  toggleColor: (color: Color) => void;
  setPriceRange: (range: [number, number] | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <>
      {/* Header dos filtros */}
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
                {cat.name} ({cat.count})
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
            { label: 'R$ 100 - R$ 150', range: [100, 150] as [number, number] },
            { label: 'Acima de R$ 150', range: [150, 9999] as [number, number] },
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

function ProductDialog({
  product,
  isOpen,
  onClose,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Selecione o tamanho e a cor');
      return;
    }
    addToCart(product, 1, selectedSize, selectedColor);
    toast.success(`${product.name} adicionado ao carrinho!`);
    onClose();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#00843D]">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-80 object-cover rounded-lg"
          />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-[#FFCC29] text-[#FFCC29]" />
              <span className="font-body">
                {product.rating} ({product.reviews} avaliações)
              </span>
            </div>

            <p className="font-display text-3xl text-[#00843D]">
              {formatPrice(product.price)}
            </p>

            <p className="text-gray-600 font-body text-sm">
              {product.description}
            </p>

            <div>
              <Label className="font-body font-medium mb-2 block">Tamanho</Label>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className="flex flex-wrap gap-2"
              >
                {product.sizes.map((size) => (
                  <div key={size}>
                    <RadioGroupItem
                      value={size}
                      id={`cat-size-${size}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`cat-size-${size}`}
                      className="flex items-center justify-center w-10 h-10 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#00843D] peer-data-[state=checked]:bg-[#00843D] peer-data-[state=checked]:text-white hover:bg-gray-100 transition-colors font-body"
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="font-body font-medium mb-2 block">Cor</Label>
              <RadioGroup
                value={selectedColor}
                onValueChange={setSelectedColor}
                className="flex flex-wrap gap-2"
              >
                {product.colors.map((color) => (
                  <div key={color}>
                    <RadioGroupItem
                      value={color}
                      id={`cat-color-${color}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`cat-color-${color}`}
                      className="flex items-center gap-2 px-3 py-2 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#00843D] peer-data-[state=checked]:bg-[#00843D]/10 hover:bg-gray-100 transition-colors font-body capitalize"
                    >
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor:
                            color === 'branco' ? '#fff'
                            : color === 'preto' ? '#000'
                            : color === 'verde' ? '#00843D'
                            : color === 'azul' ? '#002776'
                            : color === 'cinza' ? '#666'
                            : '#FFCC29',
                        }}
                      />
                      {color}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display text-lg py-6"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              ADICIONAR AO CARRINHO
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CatalogContent() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    filters,
    sortBy,
    setCategory,
    toggleSize,
    toggleColor,
    setPriceRange,
    setSortBy,
    clearFilters,
    filteredProducts,
    hasActiveFilters,
  } = useProductFilters(allProducts);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatInstallment = (price: number) => {
    return (price / 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filterProps = {
    filters,
    setCategory,
    toggleSize,
    toggleColor,
    setPriceRange,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-24" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl md:text-6xl text-[#00843D] mb-3">
            EXPLORE TODA A COLEÇÃO
          </h1>
          <p className="font-body text-lg text-gray-600">
            {filteredProducts.length}+ produtos disponíveis
          </p>
        </div>

        <div className="flex gap-8">
          {/* SIDEBAR FILTROS - DESKTOP */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-28">
              <h2 className="font-display text-xl text-gray-900 mb-4">FILTROS</h2>
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
                  <Button variant="outline" className="lg:hidden flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-display text-sm">FILTROS</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 bg-[#00843D] rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-display text-xl">FILTROS</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent {...filterProps} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop: active filters count */}
              <div className="hidden lg:flex items-center gap-3">
                <span className="font-body text-sm text-gray-500">
                  {filteredProducts.length} produtos
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
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
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
            {filteredProducts.length === 0 ? (
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
                  <div
                    key={product.id}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover-lift cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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

                      {/* Quick Add */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <Button
                          className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          COMPRAR
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-[#FFCC29] text-[#FFCC29]" />
                        <span className="text-sm font-body text-gray-600">
                          {product.rating}
                        </span>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <ProductDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

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
