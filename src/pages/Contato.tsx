import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { ArrowLeft, MessageCircle, Mail, Instagram, Clock } from 'lucide-react';
import { buildWhatsAppLink } from '@/utils/whatsapp';

export default function Contato() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero */}
        <section className="bg-[#002776] py-20 pt-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#FFCC29]/20 text-[#FFCC29] px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              Estamos aqui para você
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4">FALE CONOSCO</h1>
            <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
              Atendimento rápido e humano — porque você merece uma resposta de verdade.
            </p>
          </div>
        </section>

        {/* Cards de contato */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* WhatsApp */}
              <a
                href={buildWhatsAppLink('Olá! Vim pelo site da Bravos Brasil e preciso de ajuda.')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center hover:border-[#00843D] hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-[#00843D]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00843D]/20 transition-colors">
                  <MessageCircle className="w-6 h-6 text-[#00843D]" />
                </div>
                <p className="font-display text-lg text-[#00843D] mb-1">WHATSAPP</p>
                <p className="font-body text-sm text-gray-600 mb-3">Resposta em minutos</p>
                <span className="font-body text-xs text-[#00843D] font-semibold">CLIQUE PARA CONVERSAR →</span>
              </a>

              {/* Email */}
              <a
                href="mailto:contato@bravosbrasil.com.br"
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center hover:border-[#002776] hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-[#002776]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#002776]/20 transition-colors">
                  <Mail className="w-6 h-6 text-[#002776]" />
                </div>
                <p className="font-display text-lg text-[#002776] mb-1">E-MAIL</p>
                <p className="font-body text-sm text-gray-600 mb-3">contato@bravosbrasil.com.br</p>
                <span className="font-body text-xs text-[#002776] font-semibold">ENVIAR E-MAIL →</span>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/bravosbrasilco"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center hover:border-[#FFCC29] hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-[#FFCC29]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FFCC29]/40 transition-colors">
                  <Instagram className="w-6 h-6 text-[#002776]" />
                </div>
                <p className="font-display text-lg text-[#002776] mb-1">INSTAGRAM</p>
                <p className="font-body text-sm text-gray-600 mb-3">@bravosbrasilco</p>
                <span className="font-body text-xs text-[#002776] font-semibold">SEGUIR →</span>
              </a>

            </div>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Horário */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#00843D] rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-display text-3xl text-[#00843D]">HORÁRIO DE ATENDIMENTO</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#00843D]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { dia: 'Segunda a Sexta', horario: '9h às 18h' },
                    { dia: 'Sábado', horario: '9h às 13h' },
                    { dia: 'Domingo e Feriados', horario: 'Sem atendimento' },
                    { dia: 'WhatsApp fora do horário', horario: 'Respondemos no próximo dia útil' },
                  ].map(({ dia, horario }) => (
                    <div key={dia} className="flex justify-between items-center bg-white rounded-lg p-4 border border-gray-100">
                      <span className="font-body text-gray-600 text-sm">{dia}</span>
                      <span className="font-body font-semibold text-gray-800 text-sm">{horario}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ rápido */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#002776] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white text-sm">?</span>
                </div>
                <h2 className="font-display text-3xl text-[#002776]">DÚVIDAS FREQUENTES</h2>
              </div>
              <div className="space-y-3">
                {[
                  { q: 'Qual o prazo de entrega?', a: 'Entre 7 e 15 dias úteis dependendo da sua região. Você recebe o rastreamento por e-mail.' },
                  { q: 'Posso trocar o tamanho?', a: 'Sim! Em até 30 dias após o recebimento. Consulte nossa política de trocas para mais detalhes.' },
                  { q: 'Vocês entregam para todo o Brasil?', a: 'Sim, entregamos para todos os 27 estados via Correios e transportadoras parceiras.' },
                  { q: 'Como funciona o Gerador de Estampas com IA?', a: 'Você usa créditos para gerar estampas exclusivas com inteligência artificial. Cada novo cadastro recebe 5 créditos grátis.' },
                ].map(({ q, a }) => (
                  <div key={q} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="font-body font-semibold text-gray-800 mb-2">✦ {q}</p>
                    <p className="font-body text-gray-600 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[#002776] rounded-xl p-8 text-center mb-10">
              <h3 className="font-display text-3xl text-white mb-3">AINDA TEM DÚVIDAS?</h3>
              <p className="font-body text-white/70 mb-6">Nossa equipe responde rápido — prometemos.</p>
              <a
                href={buildWhatsAppLink('Olá! Vim pelo site da Bravos Brasil e preciso de ajuda.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FFCC29] text-[#002776] font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105"
              >
                FALAR NO WHATSAPP →
              </a>
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
