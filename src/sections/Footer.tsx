import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, /* Facebook, Youtube, Twitter, */ Shield, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const quickLinks = [
  { name: 'Início', href: '#hero' },
  { name: 'Coleção', href: '#featured' },
  { name: 'Catálogo', href: '#catalog' },
  { name: 'Sobre nós', href: '#values' },
  { name: 'Contato', href: '#footer' },
];

const supportLinks = [
  { name: 'FAQ', href: '/#faq' },
  { name: 'Trocas e devoluções', href: '/trocas-e-devolucoes' }, /* TODO: criar página */
  { name: 'Política de privacidade', href: '/politica-de-privacidade' }, /* TODO: criar página */
  { name: 'Termos de uso', href: '/termos-de-uso' }, /* TODO: criar página */
  { name: 'Rastreamento de pedido', href: '/order' },
];

/* Redes sociais ativas (demais serão adicionadas quando tiverem URL real)
   TODO: Facebook → https://facebook.com/bravosbrasil
   TODO: YouTube → adicionar URL real
   TODO: Twitter/X → adicionar URL real */
const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/bravosbrasilco/', label: 'Instagram' },
];

const paymentMethods = [
  'Pix',
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
];

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const columns = footerRef.current?.querySelectorAll('.footer-column');
      if (columns) {
        gsap.fromTo(
          columns,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            scrollTrigger: {
              trigger: footerRef.current,
              start: 'top 90%',
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="footer"
      ref={footerRef}
      className="bg-gray-900 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & Social */}
          <div className="footer-column">
            <div className="mb-6">
              <span className="font-display text-3xl text-[#00843D]">BRAVOS</span>
              <span className="font-display text-3xl text-[#FFCC29]"> BRASIL</span>
            </div>
            <p className="font-body text-gray-400 mb-6">
              Vista seu patriotismo. Roupas e acessórios que celebram a tradição brasileira.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#00843D] transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            
            {/* ADICIONAR: Links das redes sociais */}
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3 className="font-display text-xl mb-6">LINKS RÁPIDOS</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="font-body text-gray-400 hover:text-[#FFCC29] transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-column">
            <h3 className="font-display text-xl mb-6">ATENDIMENTO</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="font-body text-gray-400 hover:text-[#FFCC29] transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment */}
          <div className="footer-column">
            <h3 className="font-display text-xl mb-6">FORMAS DE PAGAMENTO</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {paymentMethods.map((method) => (
                <div
                  key={method}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-center"
                >
                  <span className="font-body text-xs text-gray-400">{method}</span>
                </div>
              ))}
            </div>
            
            <p className="font-body text-sm text-gray-400 mb-4">
              Parcele em até 12x sem juros
            </p>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="font-body text-xs">Site Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Lock className="w-5 h-5" />
                <span className="font-body text-xs">SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-gray-500">
              © 2025 BRAVOS BRASIL. Todos os direitos reservados.
            </p>
            <p className="font-body text-sm text-gray-500">
              CNPJ: XX.XXX.XXX/XXXX-XX {/* SUBSTITUIR: CNPJ real */}
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
}
