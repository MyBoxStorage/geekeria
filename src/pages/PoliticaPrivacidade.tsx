import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { ArrowLeft, Lock, Eye, Database, Shield } from 'lucide-react';
import { buildWhatsAppLink } from '@/utils/whatsapp';

export default function PoliticaPrivacidade() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero */}
        <section className="bg-[#2563EB] py-20 pt-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#F59E0B]/20 text-[#F59E0B] px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
              <Lock className="w-4 h-4" />
              Seus dados estão seguros conosco
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4">POLÍTICA DE PRIVACIDADE</h1>
            <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
            </p>
          </div>
        </section>

        {/* Cards resumo */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Database className="w-6 h-6 text-[#7C3AED]" />, bg: 'bg-[#7C3AED]/10', value: 'LGPD', desc: 'Conformidade total com a Lei Geral de Proteção de Dados', color: 'text-[#7C3AED]' },
                { icon: <Eye className="w-6 h-6 text-[#2563EB]" />, bg: 'bg-[#2563EB]/10', value: 'TRANSPARÊNCIA', desc: 'Você sabe exatamente quais dados coletamos e por quê', color: 'text-[#2563EB]' },
                { icon: <Shield className="w-6 h-6 text-[#2563EB]" />, bg: 'bg-[#F59E0B]/20', value: 'SEGURANÇA', desc: 'Seus dados nunca são vendidos a terceiros', color: 'text-[#2563EB]' },
              ].map(({ icon, bg, value, desc, color }) => (
                <div key={value} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center hover-lift">
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

            {[
              {
                num: '1', color: 'bg-[#7C3AED]', border: 'border-[#7C3AED]', title: 'QUAIS DADOS COLETAMOS', titleColor: 'text-[#7C3AED]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">Coletamos os seguintes dados para processar seus pedidos e melhorar sua experiência:</p>
                  <ul className="font-body text-gray-700 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Dados de cadastro:</strong> nome, e-mail, telefone e senha (criptografada)</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Dados de entrega:</strong> endereço completo e CEP</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Dados de pagamento:</strong> processados exclusivamente pelo Mercado Pago — não armazenamos dados de cartão</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Dados de navegação:</strong> páginas visitadas e interações, via Google Analytics 4</span></li>
                  </ul>
                </>)
              },
              {
                num: '2', color: 'bg-[#2563EB]', border: 'border-[#2563EB]', title: 'COMO USAMOS SEUS DADOS', titleColor: 'text-[#2563EB]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">Seus dados são utilizados exclusivamente para:</p>
                  <ul className="font-body text-gray-700 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span>Processar e entregar seus pedidos</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span>Enviar confirmações e atualizações de pedido por e-mail</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span>Melhorar nossos produtos e a experiência de compra</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span>Cumprir obrigações legais e fiscais</span></li>
                  </ul>
                  <p className="font-body text-gray-700 leading-relaxed mt-4"><strong>Nunca vendemos, alugamos ou compartilhamos seus dados com terceiros</strong> para fins comerciais.</p>
                </>)
              },
              {
                num: '3', color: 'bg-[#7C3AED]', border: 'border-[#7C3AED]', title: 'SEUS DIREITOS (LGPD)', titleColor: 'text-[#7C3AED]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">Conforme a LGPD, você tem direito a:</p>
                  <ul className="font-body text-gray-700 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Acesso:</strong> solicitar uma cópia de todos os seus dados armazenados</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Correção:</strong> atualizar dados incorretos ou desatualizados</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Exclusão:</strong> solicitar a remoção dos seus dados pessoais</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Portabilidade:</strong> receber seus dados em formato estruturado</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#7C3AED] font-bold mt-0.5">✦</span><span><strong>Revogação:</strong> retirar seu consentimento a qualquer momento</span></li>
                  </ul>
                </>)
              },
              {
                num: '4', color: 'bg-[#2563EB]', border: 'border-[#2563EB]', title: 'COOKIES E RASTREAMENTO', titleColor: 'text-[#2563EB]',
                content: (<>
                  <p className="font-body text-gray-700 leading-relaxed mb-4">Utilizamos cookies e tecnologias similares para:</p>
                  <ul className="font-body text-gray-700 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span><strong>Google Analytics 4:</strong> análise de tráfego e comportamento de navegação</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span><strong>Meta Pixel:</strong> mensuração de campanhas de marketing</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#2563EB] font-bold mt-0.5">✦</span><span><strong>Sessão:</strong> manter seu carrinho e login ativos</span></li>
                  </ul>
                  <p className="font-body text-gray-700 leading-relaxed mt-4">Você pode desativar cookies nas configurações do seu navegador a qualquer momento.</p>
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

            {/* CTA */}
            <div className="bg-[#2563EB] rounded-xl p-8 text-center mb-10">
              <h3 className="font-display text-3xl text-white mb-3">DÚVIDAS SOBRE SEUS DADOS?</h3>
              <p className="font-body text-white/70 mb-6">Entre em contato com nosso responsável pelo tratamento de dados</p>
              <a href={buildWhatsAppLink('Olá! Vim pela página de atendimento da GEEKERIA e preciso de ajuda.')} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#2563EB] font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105">
                FALAR NO WHATSAPP →
              </a>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 font-body text-[#7C3AED] hover:text-[#5B21B6] transition-colors">
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
