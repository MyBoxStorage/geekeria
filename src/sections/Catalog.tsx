import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Filter, X, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { allProducts, categories, sizes, colors } from '@/data/products';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCart } from '@/hooks/useCart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

interface ProductDialogProps {
  product: typeof allProducts[0] | null;
  isOpen: boolean;
  onClose: () => void;
}

function ProductDialog({ product, isOpen, onClose }: ProductDialogProps) {
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
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#7C3AED]">
            {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <img
            src={product.image ?? undefined}
            alt={product.name}
            className="w-full h-80 object-cover rounded-lg"
          />
          
          <div className="space-y-4">
            <p className="font-display text-3xl text-[#7C3AED]">
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
                      id={`size-${size}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`size-${size}`}
                      className="flex items-center justify-center w-10 h-10 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#7C3AED] peer-data-[state=checked]:bg-[#7C3AED] peer-data-[state=checked]:text-white hover:bg-gray-100 transition-colors font-body"
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
                      id={`color-${color}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`color-${color}`}
                      className="flex items-center gap-2 px-3 py-2 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#7C3AED] peer-data-[state=checked]:bg-[#7C3AED]/10 hover:bg-gray-100 transition-colors font-body capitalize"
                    >
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor:
                            color === 'branco'
                              ? '#fff'
                              : color === 'preto'
                              ? '#000'
                              : color === 'verde'
                              ? '#7C3AED'
                              : color === 'azul'
                              ? '#2563EB'
                              : color === 'cinza'
                              ? '#666'
                              : '#F59E0B',
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
              className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display text-lg py-6"
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

export function Catalog() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<typeof allProducts[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    filters,
    sortBy,
    setCategory,
    toggleSize,
    toggleColor,
    setSortBy,
    clearFilters,
    filteredProducts,
    hasActiveFilters,
  } = useProductFilters(allProducts);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <section
      id="catalog"
      ref={sectionRef}
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div ref={titleRef} className="mb-8">
          <h2 className="font-display text-5xl md:text-6xl text-[#7C3AED] mb-2">
            EXPLORE TODA A COLEÇÃO
          </h2>
          <p className="font-body text-lg text-gray-600">
            {filteredProducts.length}+ produtos disponíveis
          </p>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-[#7C3AED] rounded-full" />
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-gray-600">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="font-body text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="bestsellers">Mais vendidos</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="newest">Mais recentes</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } md:block w-full md:w-64 flex-shrink-0 space-y-6`}
          >
            {/* Category */}
            <div>
              <h3 className="font-display text-lg text-gray-900 mb-3">CATEGORIA</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.category === cat.id}
                      onCheckedChange={() => setCategory(cat.id as any)}
                    />
                    <span className="font-body text-sm text-gray-700">
                      {cat.name} ({cat.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <h3 className="font-display text-lg text-gray-900 mb-3">TAMANHO</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size as any)}
                    className={`w-10 h-10 rounded-md border-2 font-body text-sm transition-colors ${
                      filters.sizes.includes(size as any)
                        ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                        : 'border-gray-200 hover:border-[#7C3AED]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <h3 className="font-display text-lg text-gray-900 mb-3">COR</h3>
              <div className="space-y-2">
                {colors.map((color) => (
                  <label
                    key={color.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.colors.includes(color.id as any)}
                      onCheckedChange={() => toggleColor(color.id as any)}
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

            {/* Price Range */}
            <div>
              <h3 className="font-display text-lg text-gray-900 mb-3">PREÇO</h3>
              <div className="space-y-2">
                {[
                  { label: 'Até R$ 60', range: [0, 60] },
                  { label: 'R$ 60 - R$ 100', range: [60, 100] },
                  { label: 'Acima de R$ 100', range: [100, 1000] },
                ].map((price) => (
                  <label
                    key={price.label}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox />
                    <span className="font-body text-sm text-gray-700">
                      {price.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
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
                      src={product.image ?? undefined}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
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

                    {/* Quick Add */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <Button
                        className="w-full bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-display"
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
                    <h3 className="font-body font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-[#7C3AED] transition-colors">
                      {product.name}
                    </h3>
                    
                    <span className="font-display text-xl text-[#7C3AED]">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="font-body text-gray-500">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
