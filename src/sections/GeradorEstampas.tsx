import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Camera, Terminal, Sparkles, Atom, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function GeradorEstampas() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const steps = stepsRef.current?.querySelectorAll('.step-card');
      if (steps) {
        gsap.fromTo(
          steps,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      const connector = sectionRef.current?.querySelector('.connector-line');
      if (connector) {
        gsap.fromTo(
          connector,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      gsap.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const galleryCards = galleryRef.current?.querySelectorAll('.gallery-card');
      if (galleryCards) {
        gsap.fromTo(
          galleryCards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: galleryRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const exampleImages = [
    { style: 'Naruto Style', color: 'from-orange-500 to-yellow-500' },
    { style: 'Spider-Man Style', color: 'from-red-600 to-blue-600' },
    { style: 'Mandalorian Style', color: 'from-green-600 to-gray-600' },
    { style: 'Batman Style', color: 'from-gray-800 to-yellow-500' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-void overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-plasma/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        <div ref={headerRef} className="text-center mb-16">
          <span className="badge badge-plasma mb-4 inline-flex">
            <Atom className="w-3 h-3" />
            POWERED BY AI
          </span>
          <h2 className="font-display text-5xl md:text-6xl text-gradient-plasma mb-4">
            FORGE YOUR LEGEND
          </h2>
          <p className="font-body text-lg text-ink-2 max-w-2xl mx-auto">
            Envie sua foto. Escolha seu universo. Vista sua lenda.
          </p>
        </div>

        <div ref={stepsRef} className="relative mb-16">
          <div className="hidden lg:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-cosmos via-plasma to-fire origin-left connector-line" />

          <div className="grid md:grid-cols-3 gap-8">
            <div className="step-card relative">
              <div className="bg-elevated border border-dashed border-cosmos/50 rounded p-8 text-center hover:border-cosmos transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface rounded flex items-center justify-center">
                  <Camera className="w-8 h-8 text-cosmos" />
                </div>
                <span className="font-display text-4xl text-cosmos mb-2 block">01</span>
                <h3 className="font-heading font-bold text-xl text-ink mb-2">UPLOAD</h3>
                <p className="text-ink-3 text-sm">
                  Envie sua foto e escolha o universo do seu personagem favorito
                </p>
              </div>
            </div>

            <div className="step-card relative">
              <div className="bg-surface border border-rim rounded p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-elevated rounded flex items-center justify-center animate-pulse">
                  <Terminal className="w-8 h-8 text-plasma" />
                </div>
                <span className="font-display text-4xl text-plasma mb-2 block">02</span>
                <h3 className="font-heading font-bold text-xl text-ink mb-2">IA PROCESSA</h3>
                <p className="text-ink-3 text-sm">
                  Nossa IA transforma você no herói com estilo único e detalhado
                </p>
                <div className="mt-4 font-mono text-xs text-plasma/70">
                  {'>'} generating_legend.exe<span className="animate-pulse">_</span>
                </div>
              </div>
            </div>

            <div className="step-card relative">
              <div className="bg-elevated border border-rim rounded p-8 text-center hover:border-fire/50 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface rounded flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fire/10 to-transparent animate-pulse" />
                  <Sparkles className="w-8 h-8 text-fire" />
                </div>
                <span className="font-display text-4xl text-fire mb-2 block">03</span>
                <h3 className="font-heading font-bold text-xl text-ink mb-2">RESULTADO</h3>
                <p className="text-ink-3 text-sm">
                  Receba sua estampa pronta para imprimir em camisetas, moletons e mais
                </p>
              </div>
            </div>
          </div>
        </div>

        <div ref={ctaRef} className="text-center mb-20">
          <Link
            to="/minhas-estampas"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-plasma to-fire rounded font-display text-xl text-white hover:scale-[1.02] hover:shadow-lg transition-all"
          >
            <Sparkles className="w-6 h-6" />
            CRIAR MINHA ESTAMPA AGORA
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        <div ref={galleryRef}>
          <h3 className="font-heading font-bold text-center text-ink-2 mb-8 uppercase tracking-wide">
            Estilos Disponíveis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {exampleImages.map((img, i) => (
              <div
                key={i}
                className="gallery-card group relative aspect-square bg-surface border border-rim rounded overflow-hidden cursor-pointer hover:border-plasma transition-colors"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${img.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-heading font-bold text-ink text-center px-4">
                    {img.style}
                  </span>
                </div>
                <div className="absolute inset-0 bg-plasma/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-heading font-bold text-white text-sm uppercase tracking-wide">
                    Usar Este Estilo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default GeradorEstampas;
