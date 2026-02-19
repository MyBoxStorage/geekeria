import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { getAvailableColors } from '@/utils/productStock';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

/** Max products to show in the featured grid */
const FEATURED_LIMIT = 8;

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function FeaturedCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [currentGender, setCurrentGender] = useState<'masculino' | 'feminino'>('masculino');

  const modelImages = useMemo(() => {
    const imgs = product.images ?? [];
    return {
      masculino: imgs.find((img) => img.type === 'model' && img.gender === 'masculino'),
      feminino: imgs.find((img) => img.type === 'model' && img.gender === 'feminino'),
      default: imgs.find((img) => img.type === 'model') ?? imgs[0] ?? null,
    };
  }, [product.images]);

  const hasBothGenders = !!(modelImages.masculino && modelImages.feminino);

  const currentImageUrl =
    currentGender === 'feminino' && modelImages.feminino
      ? modelImages.feminino.url
      : modelImages.masculino?.url ?? modelImages.default?.url ?? product.image;

  return (
    <div
      className="product-card group bg-white rounded-xl overflow-hidden border border-gray-100 hover-lift cursor-pointer"
      onClick={onClick}
    >
      <div
        className="relative aspect-[3/4] overflow-hidden bg-gray-100"
        onMouseEnter={() => hasBothGenders && setCurrentGender('feminino')}
        onMouseLeave={() => setCurrentGender('masculino')}
      >
        <img
          src={currentImageUrl ?? undefined}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-[#00843D] text-white font-body text-xs">NOVO</Badge>
          )}
          {product.isBestseller && (
            <Badge className="bg-[#FFCC29] text-[#002776] font-body text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              MAIS VENDIDO
            </Badge>
          )}
        </div>
        {/* Quick Add Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            COMPRAR AGORA
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-[#FFCC29] text-[#FFCC29]" />
          <span className="text-sm font-body text-gray-600">{product.rating}</span>
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
          ou 3x de {formatPrice(product.price / 3)} sem juros
        </p>
      </div>
    </div>
  );
}

interface ProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

function ProductDialog({ product, isOpen, onClose }: ProductDialogProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  if (!product) return null;

  const colorOptions = getAvailableColors(product);
  const currentImage = colorOptions.find((co) => co.id === selectedColor)?.image
    ?? product.image
    ?? undefined;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Selecione o tamanho e a cor');
      return;
    }
    addToCart(product, 1, selectedSize, selectedColor);
    toast.success(`${product.name} adicionado ao carrinho!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#00843D]">
            {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-80 object-cover rounded-lg transition-all duration-300"
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
            
            <p className="text-gray-600 font-body text-sm line-clamp-3 whitespace-pre-wrap">
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
                      className="flex items-center justify-center w-10 h-10 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#00843D] peer-data-[state=checked]:bg-[#00843D] peer-data-[state=checked]:text-white hover:bg-gray-100 transition-colors font-body"
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {/* Cores */}
            {colorOptions.length > 0 && (
                <div>
                  <Label className="font-body font-medium mb-2 block">Cor</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                    {colorOptions.map((co) => (
                      <button
                        key={co.id}
                        type="button"
                        onClick={() => setSelectedColor(co.id)}
                        className={`flex items-center gap-2 px-3 py-2 border-2 rounded-md cursor-pointer transition-colors font-body capitalize text-sm ${
                          selectedColor === co.id
                            ? 'border-[#00843D] bg-[#00843D]/10'
                            : 'border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {co.hex && (
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: co.hex }}
                          />
                        )}
                        {co.name}
                      </button>
                    ))}
                  </div>
                </div>
            )}
            
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

export function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products: allProducts, isLoading } = useCatalogProducts();

  // Pick featured products: bestsellers first, then new, then the rest — capped at FEATURED_LIMIT
  const featured = allProducts
    .slice()
    .sort((a, b) => {
      if (a.isBestseller && !b.isBestseller) return -1;
      if (!a.isBestseller && b.isBestseller) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    })
    .slice(0, FEATURED_LIMIT);

  useEffect(() => {
    if (isLoading || featured.length === 0) return;

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
          },
        }
      );

      // Cards animation
      const cards = gridRef.current?.querySelectorAll('.product-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 80, rotateY: 15 },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 75%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoading, featured.length]);

  return (
    <section
      id="featured"
      ref={sectionRef}
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#FFCC29]/20 text-[#002776] px-4 py-2 rounded-full font-body text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            COMPRE 3+ E GANHE ATÉ 15% OFF
          </div>
          <h2 className="font-display text-5xl md:text-6xl text-[#00843D] mb-4">
            COLEÇÃO PATRIOTA
          </h2>
          <p className="font-body text-lg text-gray-600 max-w-2xl mx-auto">
            Designs exclusivos que celebram a brasilidade. Cada peça é uma declaração de amor ao nosso país.
          </p>
        </div>

        {/* Products Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          style={{ perspective: '1000px' }}
        >
          {isLoading && featured.length === 0
            ? Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
                <div key={`skel-${i}`} className="product-card bg-white rounded-xl overflow-hidden border border-gray-100">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            : null}
          {featured.map((product) => (
            <FeaturedCard
              key={product.id}
              product={product}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-[#002776] hover:bg-[#001F5C] text-white font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105"
          >
            <Link to="/catalogo">
              {allProducts.length > 0
                ? `VER TODA A COLEÇÃO (${allProducts.length}+ produtos)`
                : 'VER TODA A COLEÇÃO'}
            </Link>
          </Button>
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
