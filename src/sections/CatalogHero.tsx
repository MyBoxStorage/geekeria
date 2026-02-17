import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface CatalogHeroProps {
  totalProducts: number;
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

export function CatalogHero({ totalProducts, hasActiveFilters, isLoading }: CatalogHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        breadcrumbRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.3'
        )
        .fromTo(
          countRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        );

      gsap.to(imageRef.current, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to(contentRef.current, {
        opacity: 0,
        filter: 'blur(8px)',
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '80% top',
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[300px] md:h-[400px] w-full overflow-hidden"
    >
      {/* Background image with parallax */}
      <div
        ref={imageRef}
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
      >
        <img
          src="/hero-catalogo.webp"
          alt="Catálogo Bravos Brasil"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 h-full flex items-center"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Breadcrumb */}
          <nav
            ref={breadcrumbRef}
            className="flex items-center text-sm mb-4"
          >
            <Link
              to="/"
              className="text-white/80 hover:text-white transition-colors font-body"
            >
              Início
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-white/50" />
            <span className="text-white font-semibold font-body">
              Catálogo
            </span>
          </nav>

          {/* Title */}
          <h1
            ref={titleRef}
            className="font-display text-3xl md:text-5xl lg:text-6xl text-white mb-3 drop-shadow-lg"
          >
            EXPLORE TODA A COLEÇÃO
          </h1>

          {/* Dynamic product count */}
          <p
            ref={countRef}
            className="font-body text-lg text-white/90 drop-shadow-md"
          >
            {isLoading && totalProducts === 0
              ? 'Carregando coleção…'
              : hasActiveFilters
                ? `${totalProducts} produto${totalProducts !== 1 ? 's' : ''} encontrado${totalProducts !== 1 ? 's' : ''}`
                : `${totalProducts}+ produtos disponíveis`}
          </p>
        </div>
      </div>

      {/* Bottom fade into page background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
    </section>
  );
}
