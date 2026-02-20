import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingCart, Star, Sparkles } from 'lucide-react';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

gsap.registerPlugin(ScrollTrigger);

const FEATURED_LIMIT = 8;

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const imageUrl =
    product.image ??
    (product.images && product.images.length > 0 ? product.images[0].url : null);
  const productSlug = product.slug ?? product.id;

  return (
    <div
      className="product-card group relative bg-surface border border-rim rounded overflow-hidden transition-all duration-300 hover:border-fire/50 hover:shadow-card-hover"
      data-index={index}
      data-animate
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-elevated" style={{ backgroundColor: '#161625' }}>
        <img
          src={imageUrl ?? undefined}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="badge badge-fire">NOVO</span>
          )}
          {product.isBestseller && (
            <span className="badge badge-fire">
              <Sparkles className="w-3 h-3" />
              DESTAQUE
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Link
            to={`/produto/${productSlug}`}
            className="flex items-center justify-center gap-2 w-full h-12 bg-fire hover:bg-fire-bright text-white font-heading font-bold uppercase tracking-wide transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Comprar
          </Link>
        </div>
      </div>

      <div className="p-4">
        <span className="text-ink-3 text-xs uppercase tracking-[0.1em] font-heading">
          {product.category}
        </span>
        <h3 className="font-heading font-bold text-ink text-base mt-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {typeof product.rating === 'number' && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="text-ink text-sm font-heading">{product.rating}</span>
            {typeof product.reviews === 'number' && (
              <span className="text-ink-3 text-xs">({product.reviews})</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display text-2xl text-fire">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice != null && product.originalPrice > product.price && (
            <span className="text-ink-4 text-sm line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { products: allProducts, isLoading } = useCatalogProducts();

  const featuredProducts = allProducts
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
    if (isLoading || featuredProducts.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const cards = gridRef.current?.querySelectorAll('.product-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoading, featuredProducts.length]);

  return (
    <section ref={sectionRef} id="featured" className="py-24 bg-void">
      <div className="max-w-7xl mx-auto px-4">
        <div ref={headerRef} className="text-center mb-12" data-animate>
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-3">
            PRODUTOS EM DESTAQUE
          </h2>
          <p className="text-ink-3 font-body text-lg">
            Os mais vendidos da semana, escolhidos pela comunidade geek
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {isLoading && featuredProducts.length === 0
            ? Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
                <div key={`skel-${i}`} className="product-card bg-surface border border-rim rounded overflow-hidden">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))
            : null}
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/catalogo"
            className="btn-cosmos inline-flex"
          >
            VER TODOS OS PRODUTOS
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
