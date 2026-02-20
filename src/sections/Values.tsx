import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    icon: Truck,
    title: 'Frete Grátis',
    description: 'Em compras acima de R$ 299 para todo o Brasil',
  },
  {
    icon: Shield,
    title: 'Pagamento Seguro',
    description: 'Seus dados protegidos com criptografia SSL',
  },
  {
    icon: RotateCcw,
    title: 'Devolução Fácil',
    description: '7 dias para trocar ou devolver sem burocracia',
  },
  {
    icon: Headphones,
    title: 'Suporte Geek',
    description: 'Atendimento especializado para fãs de verdade',
  },
];

export function Values() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('.value-card');
      if (cards) {
        gsap.to(
          cards,
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    const fallbackTimer = setTimeout(() => {
      if (!sectionRef?.current) return;
      const els = sectionRef.current.querySelectorAll('[data-animate]');
      els.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (parseFloat(getComputedStyle(htmlEl).opacity) < 0.5) {
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'none';
        }
      });
    }, 1500);

    return () => {
      ctx.revert();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-void">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="value-card group bg-surface border border-rim rounded p-6 text-center hover:border-fire/50 transition-all"
                data-animate
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-elevated rounded flex items-center justify-center group-hover:shadow-fire transition-shadow">
                  <Icon className="w-6 h-6 text-fire" />
                </div>
                <h3 className="font-heading font-bold text-ink mb-2">
                  {value.title}
                </h3>
                <p className="text-ink-3 text-sm">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Values;
