import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { ArrowLeft, Heart, Users, Gamepad2, Zap } from 'lucide-react';

export default function Sobre() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-void">
        <Header />

        {/* Hero */}
        <section className="bg-cosmos py-20 pt-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-cosmos/20 text-cosmos px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
              <Gamepad2 className="w-4 h-4" />
              Nossa história
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4">QUEM SOMOS</h1>
            <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
              Uma marca nascida da paixão por cultura pop — e da certeza de que seu universo favorito merece virar estampa.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="py-12 bg-void border-b border-rim">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Heart className="w-6 h-6 text-fire" />, bg: 'bg-fire/10', value: 'PROPÓSITO', desc: 'Cada peça carrega uma paixão — do personagem que te marcou à saga que mudou sua vida', color: 'text-fire' },
                { icon: <Users className="w-6 h-6 text-cosmos" />, bg: 'bg-cosmos/10', value: 'COMUNIDADE', desc: 'Mais de 2.500 fãs que vestem o que amam todo dia', color: 'text-cosmos' },
                { icon: <Zap className="w-6 h-6 text-cosmos" />, bg: 'bg-cosmos/20', value: 'QUALIDADE', desc: 'Algodão premium, estampas DTG e acabamento que dura', color: 'text-cosmos' },
              ].map(({ icon, bg, value, desc, color }) => (
                <div key={value} className="card-geek rounded-xl p-6 text-center">
                  <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>{icon}</div>
                  <p className={`font-display text-xl ${color} mb-1`}>{value}</p>
                  <p className="font-body text-sm text-ink-2">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* História */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-fire rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white text-sm">1</span>
                </div>
                <h2 className="font-display text-3xl text-fire">COMO TUDO COMEÇOU</h2>
              </div>
              <div className="bg-void rounded-xl p-8 border-l-4 border-fire">
                <p className="font-body text-ink-2 leading-relaxed text-lg mb-4">
                  A Geekeria nasceu de uma pergunta simples: <strong>por que é tão difícil achar uma camiseta do que você realmente ama?</strong>
                </p>
                <p className="font-body text-ink-2 leading-relaxed mb-4">
                  Vimos fãs de Dragon Ball, Marvel, Zelda e séries cult querendo expressar sua identidade com qualidade e estética de verdade — e não encontrando. A maioria das opções era genérica, sem alma, ou de qualidade duvidosa.
                </p>
                <p className="font-body text-ink-2 leading-relaxed">
                  Então decidimos criar. Não uma loja qualquer — mas uma marca para fãs, feita por fãs. Cada estampa é pensada para quem tem paixão de verdade. Para quem cresceu acordado às 6h para ver anime antes da escola.
                </p>
              </div>
            </div>

            {/* Missão */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-cosmos rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white text-sm">2</span>
                </div>
                <h2 className="font-display text-3xl text-cosmos">NOSSA MISSÃO</h2>
              </div>
              <div className="bg-void rounded-xl p-8 border-l-4 border-cosmos">
                <p className="font-body text-ink-2 leading-relaxed text-lg mb-6">
                  Vestir quem tem paixão. Simples assim.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Identidade', text: 'Cada peça foi criada para quem sabe o que ama e não tem medo de mostrar.' },
                    { title: 'Qualidade real', text: 'Algodão 100% penteado, estampa DTG de alta definição, acabamento premium.' },
                    { title: 'Arte exclusiva', text: 'Nenhuma estampa é genérica. Cada design carrega referência e intenção.' },
                    { title: 'Comunidade', text: 'Quando você veste Geekeria, você faz parte de uma tribo de fãs.' },
                  ].map(({ title, text }) => (
                    <div key={title} className="flex items-start gap-3 card-geek rounded-xl p-4">
                      <span className="text-fire font-bold mt-0.5 flex-shrink-0">✦</span>
                      <div>
                        <p className="font-body font-semibold text-ink mb-1">{title}</p>
                        <p className="font-body text-sm text-ink-2">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manifesto */}
            <div className="mb-16 bg-cosmos rounded-xl p-8 md:p-12 text-center">
              <p className="font-display text-cosmos text-sm tracking-widest mb-4">NOSSO MANIFESTO</p>
              <blockquote className="font-display text-3xl md:text-4xl text-white leading-tight mb-6">
                "Não fazemos roupa para todo mundo."
                <br />
                "Fazemos para quem tem paixão."
              </blockquote>
              <p className="font-body text-white/70 max-w-xl mx-auto">
                Acreditamos que o que você veste conta sua história antes mesmo de você falar. E para quem ama cultura geek, essa história importa.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-fire rounded-xl p-8 text-center mb-10">
              <h3 className="font-display text-3xl text-white mb-3">FAÇA PARTE DA FAMÍLIA GEEK</h3>
              <p className="font-body text-white/80 mb-6">Conheça a coleção e encontre a estampa que é a sua cara</p>
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 bg-cosmos text-cosmos font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105"
              >
                VER COLEÇÃO →
              </Link>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 font-body text-fire hover:text-fire-bright transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar para a loja
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </CartProvider>
  );
}
