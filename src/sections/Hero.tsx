import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6 }
      )
        .fromTo(
          titleRef.current?.querySelectorAll('.title-line') || [],
          { opacity: 0, y: 100, rotateX: 45 },
          { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.15 },
          '-=0.3'
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        )
        .fromTo(
          ctaRef.current?.children || [],
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          '-=0.4'
        );

      // Parallax effect on scroll
      gsap.to(imageRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Fade out content on scroll
      gsap.to([titleRef.current, subtitleRef.current, ctaRef.current], {
        opacity: 0,
        filter: 'blur(10px)',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '50% top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <div
        ref={imageRef}
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
      >
        <img
          src="/hero-bg.jpg"
          alt="GEEKERIA"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-left w-full">
        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#2563EB] px-4 py-2 rounded-full font-body text-sm font-bold mb-8 animate-pulse-slow"
        >
          <Sparkles className="w-4 h-4" />
          ESTAMPAS NOVAS TODA SEMANA
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-6"
          style={{ perspective: '1000px' }}
        >
          <span className="title-line block">VISTA O QUE</span>
          <span className="title-line block text-gradient-geekeria">
            VOCÊ AMA
          </span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-body text-lg sm:text-xl md:text-2xl text-white/90 max-w-xl mb-10"
        >
          Camisetas geek com as estampas que marcaram sua vida. Dragon Ball, Marvel, games e muito mais — para quem cresceu amando essa arte.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={() => scrollToSection('#featured')}
            className="bg-gradient-geekeria text-white hover:opacity-90 font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105 hover:shadow-xl"
          >
            VER COLEÇÃO COMPLETA
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToSection('#customization')}
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-[#7C3AED] font-display text-lg px-8 py-6 rounded-full transition-all [&:not(:hover)]:bg-transparent"
          >
            PERSONALIZAR VIA WHATSAPP
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center animate-bounce-slow">
        <p className="font-body text-sm mb-2 opacity-70">Role para descobrir</p>
        <ArrowDown className="w-6 h-6 mx-auto" />
      </div>
    </section>
  );
}
