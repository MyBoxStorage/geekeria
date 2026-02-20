import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '50K+', label: 'Clientes Satisfeitos' },
  { value: '10K+', label: 'Estampas Criadas' },
  { value: '100+', label: 'Estilos Disponíveis' },
  { value: '4.9', label: 'Avaliação Média' },
];

export function SocialProof() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const statItems = statsRef.current?.querySelectorAll('.stat-item');
      if (statItems) {
        gsap.fromTo(
          statItems,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-surface border-y border-rim">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="stat-item text-center">
              <p className="font-display text-4xl md:text-5xl text-gradient-brand mb-2">
                {stat.value}
              </p>
              <p className="text-ink-3 font-heading text-sm uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialProof;
