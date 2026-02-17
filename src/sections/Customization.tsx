import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const features = [
  'Sua foto favorita',
  'Tema patriótico de sua escolha',
  'Frase personalizada',
  'Design sob medida',
];

export function Customization() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image animation
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: -100, rotation: -10 },
        {
          opacity: 1,
          x: 0,
          rotation: 0,
          duration: 1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );

      // Content animation
      gsap.fromTo(
        contentRef.current?.children || [],
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      );

      // Floating animation for image
      gsap.to(imageRef.current, {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const openWhatsApp = () => {
    const message = encodeURIComponent('Olá! Vim do site BRAVOS BRASIL e quero personalizar uma peça.');
    window.open(`https://wa.me/5524981313689?text=${message}`, '_blank');
  };

  return (
    <section
      id="customization"
      ref={sectionRef}
      className="py-20 bg-[#F5F5F5]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div ref={imageRef} className="relative flex justify-center">
            <div className="relative">
              <img
                src="/customization-illustration.png"
                alt="Personalização"
                className="w-full max-w-md h-auto"
              />
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#FFCC29] rounded-full opacity-20 animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#00843D] rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="space-y-6">
            <h2 className="font-display text-5xl md:text-6xl text-[#00843D]">
              CRIE SUA ESTAMPA EXCLUSIVA
            </h2>
            
            <p className="font-body text-lg text-gray-600">
              Quer algo único? Personalizamos sua peça com:
            </p>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 font-body text-gray-700"
                >
                  <span className="w-6 h-6 rounded-full bg-[#00843D] flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
                <span className="font-body text-gray-600">
                  Orçamento em minutos!
                </span>
              </div>
              
              <Button
                size="lg"
                onClick={openWhatsApp}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white font-display text-lg px-8 py-6 rounded-full transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                CHAMAR NO WHATSAPP
              </Button>
              
              <p className="text-sm text-gray-500 mt-3 font-body">
                Atendimento de segunda a sexta, 9h às 18h
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
