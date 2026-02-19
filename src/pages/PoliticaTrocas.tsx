import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { ArrowLeft, RefreshCw, Shield, Truck, Clock, AlertCircle } from 'lucide-react';

export default function PoliticaTrocas() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <CartProvider>
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-[#002776] py-20 pt-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFCC29]/20 text-[#FFCC29] px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Sua satisfação é nossa prioridade
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4">
            TROCAS E DEVOLUÇÕES
          </h1>
          <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
            Política completa de acordo com o Código de Defesa do Consumidor (CDC)
          </p>
        </div>
      </section>

      {/* Cards resumo */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#00843D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#00843D]" />
              </div>
              <p className="font-display text-2xl text-[#00843D] mb-1">7 DIAS</p>
              <p className="font-body text-sm text-gray-600">Prazo para arrependimento após recebimento</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#002776]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-[#002776]" />
              </div>
              <p className="font-display text-2xl text-[#002776] mb-1">30 DIAS</p>
              <p className="font-body text-sm text-gray-600">Para troca por defeito de fabricação</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#FFCC29]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-6 h-6 text-[#002776]" />
              </div>
              <p className="font-display text-2xl text-[#002776] mb-1">GRÁTIS</p>
              <p className="font-body text-sm text-gray-600">Frete de devolução em caso de defeito</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Seção 1 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#00843D] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-display text-white text-sm">1</span>
              </div>
              <h2 className="font-display text-3xl text-[#00843D]">DIREITO DE ARREPENDIMENTO</h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#00843D]">
              <p className="font-body text-gray-700 leading-relaxed mb-4">
                De acordo com o <strong>Art. 49 do Código de Defesa do Consumidor</strong>, você tem o direito de desistir da compra em até <strong>7 (sete) dias corridos</strong> a partir do recebimento do produto, sem necessidade de justificativa.
              </p>
              <p className="font-body text-gray-700 leading-relaxed">
                Neste caso, o produto deve ser devolvido em sua embalagem original, sem sinais de uso, com etiquetas intactas. O reembolso será processado em até <strong>10 dias úteis</strong> após o recebimento da devolução.
              </p>
            </div>
          </div>

          {/* Seção 2 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#002776] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-display text-white text-sm">2</span>
              </div>
              <h2 className="font-display text-3xl text-[#002776]">TROCA POR DEFEITO</h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#002776]">
              <p className="font-body text-gray-700 leading-relaxed mb-4">
                Caso o produto apresente <strong>defeito de fabricação</strong>, você pode solicitar a troca em até <strong>30 (trinta) dias</strong> para produtos não-duráveis (como camisetas). O frete de retorno será custeado integralmente pela Bravos Brasil.
              </p>
              <p className="font-body text-gray-700 leading-relaxed">
                Para acionar a garantia, entre em contato via WhatsApp com fotos do defeito e o número do pedido. Nossa equipe analisará e responderá em até <strong>2 dias úteis</strong>.
              </p>
            </div>
          </div>

          {/* Seção 3 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#00843D] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-display text-white text-sm">3</span>
              </div>
              <h2 className="font-display text-3xl text-[#00843D]">TROCA DE TAMANHO</h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-[#00843D]">
              <p className="font-body text-gray-700 leading-relaxed mb-4">
                Aceitamos troca de tamanho em até <strong>30 dias</strong> após o recebimento, desde que o produto esteja em perfeitas condições, sem uso, lavagem ou danos, com etiquetas originais.
              </p>
              <p className="font-body text-gray-700 leading-relaxed">
                O frete de envio do produto de volta é de <strong>responsabilidade do cliente</strong>. O frete do novo produto será cobrado normalmente. Sugerimos consultar nosso <strong>Guia de Tamanhos</strong> antes de finalizar a compra.
              </p>
            </div>
          </div>

          {/* Seção 4 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#002776] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-display text-white text-sm">4</span>
              </div>
              <h2 className="font-display text-3xl text-[#002776]">COMO SOLICITAR</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { step: '01', text: 'Entre em contato via WhatsApp informando o número do pedido' },
                { step: '02', text: 'Envie fotos do produto e descreva o motivo da solicitação' },
                { step: '03', text: 'Aguarde a aprovação da equipe em até 2 dias úteis' },
                { step: '04', text: 'Envie o produto no endereço que será informado pelo nosso time' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="font-display text-3xl text-[#FFCC29] leading-none flex-shrink-0" style={{ WebkitTextStroke: '1px #002776' }}>{step}</span>
                  <p className="font-body text-gray-700 text-sm leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Aviso importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body font-semibold text-amber-800 mb-2">Produtos que não aceitamos devolução</p>
                <p className="font-body text-amber-700 text-sm leading-relaxed">
                  Não aceitamos devoluções de produtos com sinais de uso, lavagem, danos causados pelo cliente, ou que tenham sido personalizados (estampas exclusivas sob encomenda), salvo em casos de defeito de fabricação comprovado.
                </p>
              </div>
            </div>
          </div>

          {/* CTA WhatsApp */}
          <div className="bg-[#002776] rounded-xl p-8 text-center">
            <h3 className="font-display text-3xl text-white mb-3">PRECISA DE AJUDA?</h3>
            <p className="font-body text-white/70 mb-6">Nossa equipe está pronta para te atender via WhatsApp</p>
            <a
              href={buildWhatsAppLink('Olá! Preciso de ajuda com uma troca ou devolução.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFCC29] text-[#002776] font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105"
            >
              FALAR NO WHATSAPP →
            </a>
          </div>

          {/* Voltar */}
          <div className="mt-10">
            <Link to="/" className="inline-flex items-center gap-2 font-body text-[#00843D] hover:text-[#006633] transition-colors">
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
