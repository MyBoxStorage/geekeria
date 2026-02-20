import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: 'Como funciona o gerador de estampas com IA?',
    answer:
      'É simples! Você envia uma foto sua, escolhe o universo do seu personagem favorito (anime, Marvel, Star Wars, etc.) e nossa IA transforma você em um herói. Em poucos minutos, você recebe uma estampa única pronta para imprimir em camisetas, moletons ou outros produtos.',
  },
  {
    question: 'Quanto tempo leva para receber minha estampa?',
    answer:
      'O processo de geração da estampa pela IA leva de 2 a 5 minutos. Após aprovar o resultado, se você optar por imprimir em um produto, o prazo de produção é de 3 a 5 dias úteis + o tempo de envio.',
  },
  {
    question: 'Posso usar minha estampa em qualquer produto?',
    answer:
      'Sim! Após gerar sua estampa, você pode aplicá-la em camisetas, moletons, canecas, mousepads e muitos outros produtos disponíveis em nosso catálogo.',
  },
  {
    question: 'Qual é a política de trocas e devoluções?',
    answer:
      'Você tem até 7 dias após o recebimento para solicitar troca ou devolução. O produto deve estar em perfeito estado, sem uso e com todas as etiquetas. Para estampas personalizadas geradas por IA, não aceitamos devolução por arrependimento, apenas em caso de defeito.',
  },
  {
    question: 'O frete é grátis?',
    answer:
      'Sim! Oferecemos frete grátis para todo o Brasil em compras acima de R$ 299. Para compras abaixo desse valor, o frete é calculado automaticamente no checkout.',
  },
  {
    question: 'As estampas duram na lavagem?',
    answer:
      'Sim! Utilizamos tecnologia de sublimação e serigrafia de alta qualidade. Recomendamos lavar as peças do avesso em água fria e não usar secadora para prolongar a vida útil da estampa.',
  },
];

export function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(
        headerRef.current,
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

      gsap.to(
        accordionRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: accordionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
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
    <section ref={sectionRef} className="py-24 bg-void">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12" data-animate>
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-3">
            PERGUNTAS FREQUENTES
          </h2>
          <p className="text-ink-3 font-body text-lg">
            Tire suas dúvidas sobre a GEEKERIA
          </p>
        </div>

        {/* Accordion */}
        <div ref={accordionRef} data-animate>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-surface border border-rim rounded px-6 data-[state=open]:border-fire/50"
              >
                <AccordionTrigger className="font-heading font-bold text-ink text-left hover:no-underline hover:text-fire py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-ink-2 font-body pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
