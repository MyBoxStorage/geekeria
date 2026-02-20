import { MercadoPagoProvider } from '@/components/MercadoPagoProvider';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/sections/Header';
import { Hero } from '@/sections/Hero';
import { SocialProof } from '@/sections/SocialProof';
import { FeaturedProducts } from '@/sections/FeaturedProducts';
import { VideoShowcase } from '@/sections/VideoShowcase';
import { GeradorEstampas } from '@/components/GeradorEstampas';
import { Values } from '@/sections/Values';
import { Testimonials } from '@/sections/Testimonials';
import { FAQ } from '@/sections/FAQ';
import { Newsletter } from '@/sections/Newsletter';
import { Footer } from '@/sections/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import StarField from '@/components/StarField';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/JsonLd';

export default function HomePage() {
  useSEO({
    title: 'GEEKERIA - Seu universo na estampa',
    description: 'Roupas patrióticas brasileiras com identidade nacional, fé e tradição. Camisetas premium com estampas exclusivas. Frete grátis acima de R$199.',
    canonical: '/',
  });

  return (
    <MercadoPagoProvider>
      <CartProvider>
        <div className="min-h-screen bg-void relative">
          <StarField />
          {/* Schema: Organization */}
          <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "GEEKERIA",
            "url": "https://bravosbrasil.com.br",
            "logo": "https://bravosbrasil.com.br/og-image.jpg",
            "taxID": "65.125.279/0001-85",
            "sameAs": [
              "https://www.instagram.com/geekeria/"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": "Portuguese"
            }
          }} />

          {/* Schema: WebSite + SearchAction */}
          <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "GEEKERIA",
            "url": "https://bravosbrasil.com.br",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://bravosbrasil.com.br/catalogo?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          }} />

          {/* Schema: FAQPage */}
          <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Como funciona a entrega?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Entregamos em todo Brasil via Correios. O prazo médio é de 7-15 dias úteis, dependendo da sua localização. Você recebe o código de rastreamento por e-mail assim que o pedido for enviado."
                }
              },
              {
                "@type": "Question",
                "name": "Posso trocar se não servir?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim! Você tem 7 dias após o recebimento para solicitar troca ou devolução. A peça deve estar sem uso e com as etiquetas. Veja a política completa no rodapé do site."
                }
              },
              {
                "@type": "Question",
                "name": "As estampas desbotam?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não! Usamos impressão DTG (Direct to Garment) de alta qualidade. Nossas estampas duram mais de 100 lavagens sem perder a vivacidade das cores."
                }
              },
              {
                "@type": "Question",
                "name": "Tem loja física?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Somos 100% online para oferecer os melhores preços e atender todo o Brasil. Nossa equipe está sempre disponível pelo WhatsApp para tirar dúvidas."
                }
              },
              {
                "@type": "Question",
                "name": "Como personalizar uma peça?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Entre em contato via WhatsApp com sua ideia, foto ou frase. Nosso designer vai criar uma arte e enviar para aprovação. O orçamento é grátis!"
                }
              },
              {
                "@type": "Question",
                "name": "Qual o prazo de produção?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "O prazo de produção é de 2-3 dias úteis. Após isso, o prazo de entrega dos Correios se inicia. Produtos personalizados podem levar até 5 dias úteis."
                }
              },
              {
                "@type": "Question",
                "name": "Aceitam Pix?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim! Aceitamos Pix, cartão de crédito (em até 12x via Mercado Pago) e boleto bancário. O Pix tem 5% de desconto!"
                }
              },
              {
                "@type": "Question",
                "name": "Enviam nota fiscal?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim, todas as compras acompanham Nota Fiscal Eletrônica (NF-e) enviada para o e-mail cadastrado."
                }
              }
            ]
          }} />
          <Header />
          <main>
            <Hero />
            <SocialProof />
            <FeaturedProducts />
            <VideoShowcase />
            <GeradorEstampas />
            <Values />
            <Testimonials />
            <FAQ />
            <Newsletter />
          </main>
          <Footer />
          <FloatingWhatsApp />
        </div>
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </MercadoPagoProvider>
  );
}
