import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { featuredProducts } from '@/data/products';
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
  product: typeof featuredProducts[0] | null;
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
      <DialogContent className="max-w-2xl">
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
                      className="flex items-center gap-2 px-3 py-2 border-2 rounded-md cursor-pointer peer-data-[state=checked]:border-[#00843D] peer-data-[state=checked]:bg-[#00843D]/10 hover:bg-gray-100 transition-colors font-body capitalize"
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
                              ? '#00843D'
                              : color === 'azul'
                              ? '#002776'
                              : color === 'cinza'
                              ? '#666'
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

export function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<typeof featuredProducts[0] | null>(null);

  useEffect(() => {
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
  }, []);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatInstallment = (price: number) => {
    const installment = price / 3;
    return installment.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

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
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card group bg-white rounded-xl overflow-hidden border border-gray-100 hover-lift cursor-pointer"
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

                {/* Quick Add Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <Button
                    className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    COMPRAR AGORA
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

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-[#002776] hover:bg-[#001F5C] text-white font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105"
          >
            <Link to="/catalogo">
              VER TODA A COLEÇÃO (40+ produtos)
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
