import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiConfig } from '@/config/api';

gsap.registerPlugin(ScrollTrigger);

async function postSubscribe(email: string) {
  const res = await fetch(`${apiConfig.baseURL}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Erro ao inscrever');
  return res.json();
}

export function Newsletter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(
        contentRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 85%',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Digite seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      await postSubscribe(email.trim());
      toast.success('Inscrito com sucesso! Em breve você receberá nossas novidades.');
      setEmail('');
    } catch {
      toast.error('Não foi possível inscrever. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-void border-y border-fire/30"
      style={{
        background: 'linear-gradient(135deg, var(--void) 0%, #1a0a00 50%, var(--void) 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4">
        <div ref={contentRef} className="text-center" data-animate>
          <h2 className="font-display text-4xl md:text-5xl text-gradient-brand mb-4">
            ENTRE PARA A GUILDA
          </h2>
          <p className="text-ink-2 font-body text-lg mb-8 max-w-xl mx-auto">
            Lançamentos, drops exclusivos e conteúdo geek direto para você.
            Seja o primeiro a saber das novidades.
          </p>

          <form
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            onSubmit={handleSubmit}
          >
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-4" />
              <input
                type="email"
                placeholder="seu@email.com"
                className="input-geek pl-12 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-fire px-8" disabled={loading}>
              {loading ? '...' : 'ENTRAR'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-ink-4 text-sm mt-4">
            Ao se inscrever, você concorda com nossa Política de Privacidade.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
