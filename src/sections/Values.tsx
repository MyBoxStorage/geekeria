import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cross, Award, Flag } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    icon: Cross,
    title: 'TRADIÇÃO BRASILEIRA',
    description: 'Celebramos a herança cultural e os valores que construíram nossa nação. Cada peça é uma homenagem à nossa história.',
    color: '#7C3AED',
  },
  {
    icon: Award,
    title: 'QUALIDADE PREMIUM',
    description: 'Tecidos nobres, estampas duráveis, acabamento impecável. Não aceitamos nada menos que o melhor.',
    color: '#F59E0B',
  },
  {
    icon: Flag,
    title: 'ORGULHO NACIONAL',
    description: 'Vista-se com as cores que representam nossa soberania. Seja um embaixador do Brasil onde quer que vá.',
    color: '#2563EB',
  },
];

export function Values() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

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
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );

      // SVG line draw animation
      if (lineRef.current) {
        const length = lineRef.current.getTotalLength();
        gsap.set(lineRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        
        gsap.to(lineRef.current, {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'none',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 70%',
          },
        });
      }

      // Cards animation
      const cards = cardsRef.current?.querySelectorAll('.value-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.2,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 70%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="values"
      ref={sectionRef}
      className="py-20 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="font-display text-5xl md:text-6xl text-[#7C3AED] mb-4">
            MAIS QUE ROUPAS
          </h2>
          <p className="font-display text-3xl md:text-4xl text-[#2563EB]">
            UMA DECLARAÇÃO DE VALORES
          </p>
        </div>

        {/* Cards with connecting line */}
        <div ref={cardsRef} className="relative">
          {/* SVG Connecting Line - Desktop only */}
          <svg
            className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 hidden lg:block pointer-events-none"
            viewBox="0 0 1200 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              ref={lineRef}
              d="M100 40 Q300 0 400 40 T700 40 T1100 40"
              stroke="#7C3AED"
              strokeWidth="2"
              strokeDasharray="8 8"
              fill="none"
            />
          </svg>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {values.map((value, index) => (
              <div
                key={index}
                className="value-card group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                style={{ borderLeftColor: value.color }}
              >
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-[360deg]"
                  style={{ backgroundColor: `${value.color}20` }}
                >
                  <value.icon
                    className="w-8 h-8"
                    style={{ color: value.color }}
                  />
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
