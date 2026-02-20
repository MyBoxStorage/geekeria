import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Sparkles, Star, Truck, Shield, Zap } from 'lucide-react';

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headline1Ref = useRef<HTMLHeadingElement>(null);
  const headline2Ref = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Badge animation
      tl.to(
        badgeRef.current,
        { y: 0, opacity: 1, duration: 0.5 }
      );

      // Headline 1
      tl.to(
        headline1Ref.current,
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.3'
      );

      // Headline 2
      tl.to(
        headline2Ref.current,
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      );

      // Subheadline
      tl.to(
        subheadRef.current,
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.3'
      );

      // CTA Group
      tl.to(
        ctaGroupRef.current,
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.3'
      );

      // Trust row
      tl.to(
        trustRef.current,
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.3'
      );

      // Mockup
      tl.to(
        mockupRef.current,
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.8'
      );

      // Float animation for mockup
      gsap.to(mockupRef.current, {
        y: -8,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, heroRef);

    const fallbackTimer = setTimeout(() => {
      const els = [
        badgeRef.current,
        headline1Ref.current,
        headline2Ref.current,
        subheadRef.current,
        ctaGroupRef.current,
        trustRef.current,
      ];
      els.forEach((el) => {
        if (el && parseFloat(getComputedStyle(el).opacity) < 0.5) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    }, 2000);

    return () => {
      ctx.revert();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-void"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-radial from-cosmos/10 via-transparent to-transparent" />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, var(--void) 70%)'
        }}
      />

      {/* Scanline Effect */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Badge */}
            <div ref={badgeRef} className="inline-flex opacity-0 will-change-[opacity]">
              <span className="badge badge-outline-fire px-3 py-1.5 text-xs">
                <Zap className="w-3 h-3" />
                NOVA FEATURE
              </span>
            </div>

            {/* Headlines */}
            <h1
              ref={headline1Ref}
              className="font-display text-hero text-ink leading-none opacity-0 will-change-[opacity]"
            >
              VOCÊ NO UNIVERSO
            </h1>
            <h1
              ref={headline2Ref}
              className="font-display text-hero text-gradient-brand leading-none opacity-0 will-change-[opacity]"
            >
              DO SEU HERÓI
            </h1>

            {/* Subheadline */}
            <p
              ref={subheadRef}
              className="font-body text-lg text-ink-2 max-w-md opacity-0 will-change-[opacity]"
            >
              Gere sua estampa exclusiva com IA. Vista qualquer personagem.
              Transforme-se na lenda que você sempre quis ser.
            </p>

            {/* CTA Group */}
            <div ref={ctaGroupRef} className="flex flex-wrap gap-4 pt-2 opacity-0 will-change-[opacity]">
              <Link
                to="/minhas-estampas"
                className="btn-fire h-14 px-8 text-lg shadow-fire"
              >
                <Sparkles className="w-5 h-5" />
                CRIAR MINHA ESTAMPA
              </Link>
              <Link
                to="/catalogo"
                className="btn-cosmos h-14 px-8"
              >
                VER CATÁLOGO
              </Link>
            </div>

            {/* Trust Row */}
            <div ref={trustRef} className="flex flex-wrap items-center gap-6 pt-4 opacity-0 will-change-[opacity]">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
                <span className="text-ink-2 text-sm ml-2 font-heading">
                  10K+ estampas criadas
                </span>
              </div>
              <div className="flex items-center gap-2 text-ink-3 text-sm">
                <Truck className="w-4 h-4" />
                <span>Entrega em todo Brasil</span>
              </div>
              <div className="flex items-center gap-2 text-ink-3 text-sm">
                <Shield className="w-4 h-4" />
                <span>Pagamento seguro</span>
              </div>
            </div>
          </div>

          {/* Right Column - Mockup */}
          <div ref={mockupRef} className="relative hidden lg:flex justify-center items-center opacity-0 will-change-[opacity]">
            {/* Decorative circles */}
            <div className="absolute w-80 h-80 rounded-full border border-rim opacity-30" />
            <div className="absolute w-96 h-96 rounded-full border border-rim opacity-20" />
            <div className="absolute w-[28rem] h-[28rem] rounded-full border border-rim opacity-10" />

            {/* T-shirt Mockup */}
            <div className="relative">
              <svg
                viewBox="0 0 200 240"
                className="w-64 h-80 drop-shadow-2xl"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* T-shirt shape */}
                <path
                  d="M50 20 L80 20 L100 40 L120 20 L150 20 L170 50 L150 70 L140 60 L140 220 L60 220 L60 60 L50 70 L30 50 Z"
                  fill="#1a1a2e"
                  stroke="#FF4500"
                  strokeWidth="2"
                />
                {/* Print area */}
                <rect x="70" y="70" width="60" height="70" rx="4" fill="#0f0f1a" stroke="#252538" />
                {/* Character silhouette */}
                <circle cx="100" cy="95" r="15" fill="#FF4500" opacity="0.8" />
                <path
                  d="M85 115 Q100 105 115 115 L115 135 Q100 140 85 135 Z"
                  fill="#0A84FF"
                  opacity="0.8"
                />
                {/* Spark effect */}
                <path d="M100 50 L100 40" stroke="#FF4500" strokeWidth="2" />
                <path d="M100 160 L100 170" stroke="#FF4500" strokeWidth="2" />
                <path d="M60 105 L50 105" stroke="#0A84FF" strokeWidth="2" />
                <path d="M140 105 L150 105" stroke="#0A84FF" strokeWidth="2" />
              </svg>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 badge badge-plasma animate-glow-pulse">
                <Sparkles className="w-3 h-3" />
                GERADO COM IA
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
