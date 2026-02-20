import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { ArrowLeft, RefreshCw, Shield, Truck, Clock, AlertCircle } from 'lucide-react';
import { buildWhatsAppLink } from '@/utils/whatsapp';

export default function PoliticaTrocas() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero */}
        <section className="bg-[#2563EB] py-20 pt-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#F59E0B]/20 text-[#F59E0B] px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Sua satisfação é nossa prioridade
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4">TROCAS E DEVOLUÇÕES</h1>
            <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
              Política completa de acordo com o Código de Defesa do Consumidor (CDC)
            </p>
          </div>
        </section>

        {/* Cards resumo */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Clock className="w-6 h-6 text-[#7C3AED]" />, bg: 'bg-[#7C3AED]/10', value: '7 DIAS', desc: 'Prazo para arrependimento após recebimento', color: 'text-[#7C3AED]' },
                { icon: <RefreshCw className="w-6 h-6 text-[#2563EB]" />, bg: 'bg-[#2563EB]/10', value: '30 DIAS', desc: 'Para troca por defeito de fabricação', color: 'text-[#2563EB]' },
                { icon: <Truck className="w-6 h-6 text-[#2563EB]" />, bg: 'bg-[#F59E0B]/20', value: 'GRÁTIS', desc: 'Frete de devolução em caso de defeito', color: 'text-[#2563EB]' },
              ].map(({ icon, bg, value, desc, color }) => (
                <div key={value} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center hover-lift">
                  <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>{icon}</div>
                  <p className={`font-display text-2xl ${color} mb-1`}>{value}</p>
                  <p className="font-body text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {[
              {
                num: '1', color: 'bg-[#7C3AED]', border: 'border-[#7C3AED]', title: 'DIREITO DE ARREPENDIMENTO', titleColor: 'text-[#7C3AED]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">De acordo com o <strong>Art. 49 do Código de Defesa do Consumidor</strong>, você tem o direito de desistir da compra em até <strong>7 (sete) dias corridos</strong> a partir do recebimento do produto, sem necessidade de justificativa.</p>
                  <p className="font-body text-gray-700 leading-relaxed">O produto deve ser devolvido em sua embalagem original, sem sinais de uso, com etiquetas intactas. O reembolso será processado em até <strong>10 dias úteis</strong> após o recebimento.</p>
                </>)
              },
              {
                num: '2', color: 'bg-[#2563EB]', border: 'border-[#2563EB]', title: 'TROCA POR DEFEITO', titleColor: 'text-[#2563EB]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">Caso o produto apresente <strong>defeito de fabricação</strong>, você pode solicitar a troca em até <strong>30 (trinta) dias</strong>. O frete de retorno será custeado integralmente pela GEEKERIA.</p>
                  <p className="font-body text-gray-700 leading-relaxed">Entre em contato via WhatsApp com fotos do defeito e o número do pedido. Nossa equipe responderá em até <strong>2 dias úteis</strong>.</p>
                </>)
              },
              {
                num: '3', color: 'bg-[#7C3AED]', border: 'border-[#7C3AED]', title: 'TROCA DE TAMANHO', titleColor: 'text-[#7C3AED]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">Aceitamos troca de tamanho em até <strong>30 dias</strong> após o recebimento, desde que o produto esteja sem uso, lavagem ou danos, com etiquetas originais.</p>
                  <p className="font-body text-gray-700 leading-relaxed">O frete de envio de volta é de <strong>responsabilidade do cliente</strong>. Sugerimos consultar nosso <strong>Guia de Tamanhos</strong> antes de finalizar a compra.</p>
                </>)
              },
            ].map(({ num, color, border, title, titleColor, content }) => (
              <div key={num} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="font-display text-white text-sm">{num}</span>
                  </div>
                  <h2 className={`font-display text-3xl ${titleColor}`}>{title}</h2>
                </div>
                <div className={`bg-gray-50 rounded-xl p-6 border-l-4 ${border}`}>{content}</div>
              </div>
            ))}

            {/* Como solicitar */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white text-sm">4</span>
                </div>
                <h2 className="font-display text-3xl text-[#2563EB]">COMO SOLICITAR</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { step: '01', text: 'Entre em contato via WhatsApp informando o número do pedido' },
                  { step: '02', text: 'Envie fotos do produto e descreva o motivo da solicitação' },
                  { step: '03', text: 'Aguarde a aprovação da equipe em até 2 dias úteis' },
                  { step: '04', text: 'Envie o produto no endereço que será informado pelo nosso time' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <span className="font-display text-3xl text-[#F59E0B] leading-none flex-shrink-0" style={{ WebkitTextStroke: '1px #2563EB' }}>{step}</span>
                    <p className="font-body text-gray-700 text-sm leading-relaxed pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body font-semibold text-amber-800 mb-2">Produtos que não aceitamos devolução</p>
                  <p className="font-body text-amber-700 text-sm leading-relaxed">Não aceitamos devoluções de produtos com sinais de uso, lavagem, danos causados pelo cliente, ou que tenham sido personalizados sob encomenda, salvo em casos de defeito de fabricação comprovado.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[#2563EB] rounded-xl p-8 text-center">
              <h3 className="font-display text-3xl text-white mb-3">PRECISA DE AJUDA?</h3>
              <p className="font-body text-white/70 mb-6">Nossa equipe está pronta para te atender via WhatsApp</p>
              <a
                href={buildWhatsAppLink('Olá! Vim pela página de atendimento da GEEKERIA e preciso de ajuda.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#2563EB] font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105"
              >
                FALAR NO WHATSAPP →
              </a>
            </div>

            <div className="mt-10">
              <Link to="/" className="inline-flex items-center gap-2 font-body text-[#7C3AED] hover:text-[#5B21B6] transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar para a loja
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </CartProvider>
  );
}
