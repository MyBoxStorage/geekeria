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

export default function HomePage() {
  return (
    <MercadoPagoProvider>
      <CartProvider>
        <div className="min-h-screen bg-white">
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
        </div>
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </MercadoPagoProvider>
  );
}
