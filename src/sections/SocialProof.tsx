import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package, MapPin, Flag, Palette } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    icon: Package,
    value: 2500,
    suffix: '+',
    label: 'Peças Vendidas',
  },
  {
    icon: MapPin,
    value: 27,
    suffix: '',
    label: 'Estados Atendidos',
  },
  {
    icon: Flag,
    value: 100,
    suffix: '%',
    label: 'Feito com Orgulho',
  },
  {
    icon: Palette,
    value: 100,
    suffix: '%',
    label: 'Estampas Exclusivas',
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const element = counterRef.current;
    if (!element || hasAnimated.current) return;

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top 80%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const obj = { val: 0 };
        gsap.to(obj, {
          val: value,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            setDisplayValue(Math.floor(obj.val));
          },
        });
      },
    });

    return () => trigger.kill();
  }, [value]);

  return (
    <span ref={counterRef} className="font-display text-4xl md:text-5xl text-white">
      {displayValue.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

export function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 90%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const marqueeItems = [
    'FRETE GRÁTIS ACIMA DE R$ 200',
    'ESTAMPAS EXCLUSIVAS',
    'QUALIDADE PREMIUM',
    'ENTREGA EM TODO BRASIL',
    'TROCA FÁCIL',
    'ATENDIMENTO VIA WHATSAPP',
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-r from-[#00843D] via-[#006633] to-[#002776] py-12 overflow-hidden"
    >
      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="w-10 h-10 text-[#FFCC29] mx-auto mb-3" />
              <div className="font-display text-4xl md:text-5xl text-white mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="font-body text-sm text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <div className="relative border-t border-white/20 pt-6">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#00843D] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#002776] to-transparent z-10" />
        
        <div ref={marqueeRef} className="overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span
                key={index}
                className="font-display text-lg md:text-xl text-white/70 mx-8 flex items-center gap-3"
              >
                <span className="w-2 h-2 bg-[#FFCC29] rounded-full" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
