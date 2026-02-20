import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: 'Pedro Silva',
    avatar: 'PS',
    universe: 'Fã de Anime',
    rating: 5,
    quote: 'Criei uma estampa minha no estilo Naruto e ficou INCRÍVEL! A qualidade da camiseta é excelente e a entrega foi super rápida.',
  },
  {
    name: 'Maria Costa',
    avatar: 'MC',
    universe: 'Fã de Marvel',
    rating: 5,
    quote: 'Minha estampa do Spider-Man com meu rosto foi o sucesso da festa de aniversário. Todo mundo queria saber onde comprei!',
  },
  {
    name: 'Lucas Mendes',
    avatar: 'LM',
    universe: 'Fã de Star Wars',
    rating: 5,
    quote: 'A GEEKERIA entende o que os fãs querem. O gerador de estampas é mágico, parece que realmente estou no universo Star Wars!',
  },
];

export function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

      const cards = cardsRef.current?.querySelectorAll('.testimonial-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-void">
      <div className="max-w-7xl mx-auto px-4">
        <div ref={headerRef} className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-3">
            O QUE OS FÃS DIZEM
          </h2>
          <p className="text-ink-3 font-body text-lg">
            Histórias reais de quem já viveu a experiência GEEKERIA
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card bg-surface border border-rim rounded p-6 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-rim" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>

              <p className="text-ink-2 font-body italic mb-6">
                &quot;{testimonial.quote}&quot;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fire to-cosmos flex items-center justify-center text-white font-heading font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-heading font-bold text-ink">
                    {testimonial.name}
                  </p>
                  <span className="badge badge-plasma text-[10px]">
                    {testimonial.universe}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
