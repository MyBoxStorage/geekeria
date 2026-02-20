import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, CreditCard, Shield, Truck, RotateCcw } from 'lucide-react';

// Logo SVG Component
function GeekeriaLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4500" />
          <stop offset="100%" stopColor="#0A84FF" />
        </linearGradient>
      </defs>
      <rect x="16" y="4" width="8" height="4" fill="url(#footerLogoGradient)" />
      <rect x="12" y="8" width="4" height="4" fill="url(#footerLogoGradient)" />
      <rect x="24" y="8" width="4" height="4" fill="url(#footerLogoGradient)" />
      <rect x="8" y="12" width="4" height="8" fill="url(#footerLogoGradient)" />
      <rect x="28" y="12" width="4" height="8" fill="url(#footerLogoGradient)" />
      <rect x="4" y="16" width="4" height="8" fill="url(#footerLogoGradient)" />
      <rect x="32" y="16" width="4" height="8" fill="url(#footerLogoGradient)" />
      <rect x="16" y="16" width="8" height="8" fill="url(#footerLogoGradient)" />
      <rect x="8" y="24" width="4" height="4" fill="url(#footerLogoGradient)" />
      <rect x="28" y="24" width="4" height="4" fill="url(#footerLogoGradient)" />
      <rect x="12" y="28" width="4" height="4" fill="url(#footerLogoGradient)" />
      <rect x="24" y="28" width="4" height="4" fill="url(#footerLogoGradient)" />
      <rect x="16" y="32" width="8" height="4" fill="url(#footerLogoGradient)" />
    </svg>
  );
}

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/geekeria/', label: 'Instagram', external: true },
  { icon: Facebook, href: '/sobre', label: 'Facebook' },
  { icon: Twitter, href: '/sobre', label: 'Twitter' },
  { icon: Youtube, href: '/sobre', label: 'Youtube' },
];

export function Footer() {
  const footerLinks = {
    loja: [
      { label: 'Catálogo', href: '/catalogo' },
      { label: 'Lançamentos', href: '/catalogo?isNew=true' },
      { label: 'Destaques', href: '/catalogo?isFeatured=true' },
      { label: 'Ofertas', href: '/catalogo?onSale=true' },
    ],
    ajuda: [
      { label: 'Sobre nós', href: '/sobre' },
      { label: 'Central de Ajuda', href: '/contato' },
      { label: 'Trocas e Devoluções', href: '/trocas-e-devolucoes' },
      { label: 'Política de Privacidade', href: '/politica-de-privacidade' },
      { label: 'Termos de Uso', href: '/termos-de-uso' },
    ],
    conta: [
      { label: 'Minha Conta', href: '/minha-conta' },
      { label: 'Meus Pedidos', href: '/minha-conta' },
      { label: 'Lista de Desejos', href: '/minha-conta' },
      { label: 'Criar Estampa', href: '/minhas-estampas' },
    ],
  };

  return (
    <footer className="bg-surface border-t-2 border-fire relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <GeekeriaLogo className="w-10 h-10" />
              <span className="font-display text-3xl text-ink tracking-[0.08em]">
                GEEKERIA
              </span>
            </div>
            <p className="text-ink-3 font-body mb-6">
              Vista o que você ama.
            </p>
            <p className="text-ink-2 text-sm mb-6 max-w-sm">
              E-commerce de vestuário e colecionáveis geek com gerador de estampas por IA.
              Transforme-se no herói do seu universo favorito.
            </p>
            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, href, label, external }) =>
                external ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 flex items-center justify-center bg-elevated text-ink-3 hover:bg-fire hover:text-white transition-all rounded"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ) : (
                  <Link
                    key={label}
                    to={href}
                    aria-label={label}
                    className="w-10 h-10 flex items-center justify-center bg-elevated text-ink-3 hover:bg-fire hover:text-white transition-all rounded"
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-bold text-ink uppercase tracking-wide mb-4">
              Loja
            </h4>
            <ul className="space-y-2">
              {footerLinks.loja.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-ink-3 hover:text-fire transition-colors font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-ink uppercase tracking-wide mb-4">
              Ajuda
            </h4>
            <ul className="space-y-2">
              {footerLinks.ajuda.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-ink-3 hover:text-fire transition-colors font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-ink uppercase tracking-wide mb-4">
              Minha Conta
            </h4>
            <ul className="space-y-2">
              {footerLinks.conta.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-ink-3 hover:text-fire transition-colors font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-rim pt-8 mb-8">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="font-display text-2xl text-ink mb-2">
              ENTRE PARA A GUILDA
            </h4>
            <p className="text-ink-3 text-sm mb-4">
              Lançamentos, drops exclusivos e conteúdo geek direto para você.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="seu@email.com"
                className="input-geek flex-1"
              />
              <button type="submit" className="btn-fire px-6">
                ENTRAR
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-rim pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ink-4 text-sm">
            © 2024 GEEKERIA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <CreditCard className="w-6 h-6 text-ink-4" />
            <Shield className="w-6 h-6 text-ink-4" />
            <Truck className="w-6 h-6 text-ink-4" />
            <RotateCcw className="w-6 h-6 text-ink-4" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
