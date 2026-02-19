import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { ArrowLeft, Heart, Users, Flag, Zap } from 'lucide-react';

export default function Sobre() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero */}
        <section className="bg-[#002776] py-20 pt-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#FFCC29]/20 text-[#FFCC29] px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
              <Flag className="w-4 h-4" />
              Nossa história
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4">QUEM SOMOS</h1>
            <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
              Uma marca nascida do orgulho de ser brasileiro — e da certeza de que estilo e valores andam juntos.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Heart className="w-6 h-6 text-[#00843D]" />, bg: 'bg-[#00843D]/10', value: 'PROPÓSITO', desc: 'Cada peça carrega uma mensagem — de quem você é e no que acredita', color: 'text-[#00843D]' },
                { icon: <Users className="w-6 h-6 text-[#002776]" />, bg: 'bg-[#002776]/10', value: 'COMUNIDADE', desc: 'Mais de 2.500 brasileiros que vestem seus valores todo dia', color: 'text-[#002776]' },
                { icon: <Zap className="w-6 h-6 text-[#002776]" />, bg: 'bg-[#FFCC29]/20', value: 'QUALIDADE', desc: 'Algodão premium, estampas DTG e acabamento que dura', color: 'text-[#002776]' },
              ].map(({ icon, bg, value, desc, color }) => (
                <div key={value} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
                  <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>{icon}</div>
                  <p className={`font-display text-xl ${color} mb-1`}>{value}</p>
                  <p className="font-body text-sm text-gray-600">{desc}</p>
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
                <div className="w-8 h-8 bg-[#00843D] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white text-sm">1</span>
                </div>
                <h2 className="font-display text-3xl text-[#00843D]">COMO TUDO COMEÇOU</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 border-l-4 border-[#00843D]">
                <p className="font-body text-gray-700 leading-relaxed text-lg mb-4">
                  A Bravos Brasil nasceu de uma inquietação simples: <strong>por que é tão difícil encontrar uma roupa que diga quem você é de verdade?</strong>
                </p>
                <p className="font-body text-gray-700 leading-relaxed mb-4">
                  Vimos brasileiros de todos os cantos querendo mostrar orgulho, posicionamento e identidade — mas sem encontrar peças que fizessem isso com qualidade e estética de verdade. A maioria era genérica, sem alma, feita pra qualquer um.
                </p>
                <p className="font-body text-gray-700 leading-relaxed">
                  Então decidimos criar. Não uma loja qualquer — mas uma marca com propósito. Cada estampa é pensada para quem tem convicção. Para quem não precisa gritar, mas quer que sua roupa fale por ele.
                </p>
              </div>
            </div>

            {/* Missão */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#002776] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white text-sm">2</span>
                </div>
                <h2 className="font-display text-3xl text-[#002776]">NOSSA MISSÃO</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 border-l-4 border-[#002776]">
                <p className="font-body text-gray-700 leading-relaxed text-lg mb-6">
                  Vestir quem tem valores. Simples assim.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Identidade', text: 'Cada peça foi criada para quem sabe quem é e não tem medo de mostrar.' },
                    { title: 'Qualidade real', text: 'Algodão 100% penteado, estampa DTG de alta definição, acabamento premium.' },
                    { title: 'Arte exclusiva', text: 'Nenhuma estampa é genérica. Cada design carrega significado e intenção.' },
                    { title: 'Comunidade', text: 'Quando você veste Bravos Brasil, você faz parte de algo maior.' },
                  ].map(({ title, text }) => (
                    <div key={title} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                      <span className="text-[#00843D] font-bold mt-0.5 flex-shrink-0">✦</span>
                      <div>
                        <p className="font-body font-semibold text-gray-800 mb-1">{title}</p>
                        <p className="font-body text-sm text-gray-600">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manifesto */}
            <div className="mb-16 bg-[#002776] rounded-xl p-8 md:p-12 text-center">
              <p className="font-display text-[#FFCC29] text-sm tracking-widest mb-4">NOSSO MANIFESTO</p>
              <blockquote className="font-display text-3xl md:text-4xl text-white leading-tight mb-6">
                "Não fazemos roupa para todo mundo."
                <br />
                "Fazemos para quem tem convicção."
              </blockquote>
              <p className="font-body text-white/70 max-w-xl mx-auto">
                Acreditamos que o que você veste comunica quem você é antes mesmo de você falar. E para quem tem valores, essa comunicação importa.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-[#00843D] rounded-xl p-8 text-center mb-10">
              <h3 className="font-display text-3xl text-white mb-3">FAÇA PARTE DA FAMÍLIA</h3>
              <p className="font-body text-white/80 mb-6">Conheça a coleção e encontre a peça que fala por você</p>
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 bg-[#FFCC29] text-[#002776] font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105"
              >
                VER COLEÇÃO →
              </Link>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 font-body text-[#00843D] hover:text-[#006633] transition-colors">
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
