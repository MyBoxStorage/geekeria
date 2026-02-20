import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Header } from '@/sections/Header';
import { Footer } from '@/sections/Footer';
import { ArrowLeft, FileText, ShoppingBag, AlertCircle, Scale } from 'lucide-react';
import { buildWhatsAppLink } from '@/utils/whatsapp';

export default function TermosDeUso() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-void">
        <Header />

        {/* Hero */}
        <section className="bg-cosmos py-20 pt-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-cosmos/20 text-cosmos px-4 py-2 rounded-full font-body text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Transparência e clareza nas regras
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-4">TERMOS DE USO</h1>
            <p className="font-body text-lg text-white/70 max-w-2xl mx-auto">
              Ao utilizar o site da GEEKERIA, você concorda com os termos abaixo
            </p>
          </div>
        </section>

        {/* Cards resumo */}
        <section className="py-12 bg-void border-b border-rim">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <ShoppingBag className="w-6 h-6 text-fire" />, bg: 'bg-fire/10', value: 'COMPRAS', desc: 'Regras claras para pedidos, pagamentos e entregas', color: 'text-fire' },
                { icon: <Scale className="w-6 h-6 text-cosmos" />, bg: 'bg-cosmos/10', value: 'CDC', desc: 'Conformidade com o Código de Defesa do Consumidor', color: 'text-cosmos' },
                { icon: <AlertCircle className="w-6 h-6 text-cosmos" />, bg: 'bg-cosmos/20', value: 'DIREITOS', desc: 'Seus direitos e responsabilidades como cliente', color: 'text-cosmos' },
              ].map(({ icon, bg, value, desc, color }) => (
                <div key={value} className="card-geek rounded-xl p-6 text-center hover-lift">
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

            {[
              {
                num: '1', color: 'bg-fire', border: 'border-fire', title: 'ACEITAÇÃO DOS TERMOS', titleColor: 'text-fire',
                content: (<p className="font-body text-ink-2 leading-relaxed">Ao acessar e utilizar o site <strong>bravosbrasil.com.br</strong>, você declara ter lido, compreendido e concordado com estes Termos de Uso. Caso não concorde com alguma condição, recomendamos que não utilize nossos serviços. A GEEKERIA reserva o direito de atualizar estes termos a qualquer momento, sendo sua responsabilidade verificá-los periodicamente.</p>)
              },
              {
                num: '2', color: 'bg-cosmos', border: 'border-cosmos', title: 'CADASTRO E CONTA', titleColor: 'text-cosmos',
                content: (<>
                  <p className="font-body text-ink-2 leading-relaxed mb-4">Para realizar compras, você pode criar uma conta ou comprar como visitante. Ao se cadastrar, você concorda em:</p>
                  <ul className="font-body text-ink-2 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-cosmos font-bold mt-0.5">✦</span><span>Fornecer informações verídicas e atualizadas</span></li>
                    <li className="flex items-start gap-2"><span className="text-cosmos font-bold mt-0.5">✦</span><span>Manter a confidencialidade da sua senha</span></li>
                    <li className="flex items-start gap-2"><span className="text-cosmos font-bold mt-0.5">✦</span><span>Notificar-nos imediatamente sobre uso não autorizado da sua conta</span></li>
                    <li className="flex items-start gap-2"><span className="text-cosmos font-bold mt-0.5">✦</span><span>Ser responsável por todas as atividades realizadas na sua conta</span></li>
                  </ul>
                </>)
              },
              {
                num: '3', color: 'bg-fire', border: 'border-fire', title: 'PEDIDOS E PAGAMENTOS', titleColor: 'text-fire',
                content: (<>
                  <p className="font-body text-ink-2 leading-relaxed mb-4">Ao realizar um pedido na GEEKERIA:</p>
                  <ul className="font-body text-ink-2 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>Os preços estão em Reais (BRL) e incluem impostos aplicáveis</span></li>
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>O pagamento é processado com segurança pelo Mercado Pago</span></li>
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>O pedido só é confirmado após a aprovação do pagamento</span></li>
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>Reservamo-nos o direito de cancelar pedidos com indícios de fraude</span></li>
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>Cupons de desconto são de uso único e não acumuláveis, salvo indicação contrária</span></li>
                  </ul>
                </>)
              },
              {
                num: '4', color: 'bg-cosmos', border: 'border-cosmos', title: 'PROPRIEDADE INTELECTUAL', titleColor: 'text-cosmos',
                content: (<p className="font-body text-ink-2 leading-relaxed">Todo o conteúdo do site — incluindo textos, imagens, logotipos, estampas, designs e código-fonte — é de propriedade exclusiva da <strong>GEEKERIA</strong> e está protegido pelas leis de direitos autorais. É proibida a reprodução, distribuição ou uso comercial sem autorização prévia e por escrito. As estampas geradas pelo Gerador de Estampas com IA são de uso pessoal do cliente que as criou.</p>)
              },
              {
                num: '5', color: 'bg-fire', border: 'border-fire', title: 'LIMITAÇÃO DE RESPONSABILIDADE', titleColor: 'text-fire',
                content: (<>
                  <p className="font-body text-ink-2 leading-relaxed mb-4">A GEEKERIA não se responsabiliza por:</p>
                  <ul className="font-body text-ink-2 space-y-2">
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>Atrasos causados por transportadoras ou eventos de força maior</span></li>
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>Danos causados pelo uso indevido dos produtos</span></li>
                    <li className="flex items-start gap-2"><span className="text-fire font-bold mt-0.5">✦</span><span>Indisponibilidade temporária do site por manutenção ou falhas técnicas</span></li>
                  </ul>
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
                <div className={`bg-void rounded-xl p-6 border-l-4 ${border}`}>{content}</div>
              </div>
            ))}

            {/* Foro */}
            <div className="bg-void border border-rim rounded-xl p-6 mb-12">
              <p className="font-body text-ink-2 text-sm leading-relaxed text-center">
                Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de <strong>Petrópolis — RJ</strong> para dirimir quaisquer controvérsias.<br />
                Última atualização: fevereiro de 2026.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-cosmos rounded-xl p-8 text-center mb-10">
              <h3 className="font-display text-3xl text-white mb-3">AINDA TEM DÚVIDAS?</h3>
              <p className="font-body text-white/70 mb-6">Nossa equipe está pronta para te atender</p>
              <a href={buildWhatsAppLink('Olá! Vim pela página de atendimento da GEEKERIA e preciso de ajuda.')} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-cosmos text-white font-display text-lg px-8 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105">
                FALAR NO WHATSAPP →
              </a>
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
