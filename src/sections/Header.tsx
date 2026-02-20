import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  Sun,
  Moon,
  Minus,
  Plus,
  Trash2,
  Package,
  LogOut,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { CheckoutWithBrick } from '@/components/CheckoutWithBrick';
import { TrustBadges } from '@/components/TrustBadges';

// Logo SVG do Kimi (símbolo + gradiente fire→cosmos)
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
        <linearGradient id="headerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4500" />
          <stop offset="100%" stopColor="#0A84FF" />
        </linearGradient>
      </defs>
      <rect x="16" y="4" width="8" height="4" fill="url(#headerLogoGradient)" />
      <rect x="12" y="8" width="4" height="4" fill="url(#headerLogoGradient)" />
      <rect x="24" y="8" width="4" height="4" fill="url(#headerLogoGradient)" />
      <rect x="8" y="12" width="4" height="8" fill="url(#headerLogoGradient)" />
      <rect x="28" y="12" width="4" height="8" fill="url(#headerLogoGradient)" />
      <rect x="4" y="16" width="4" height="8" fill="url(#headerLogoGradient)" />
      <rect x="32" y="16" width="4" height="8" fill="url(#headerLogoGradient)" />
      <rect x="16" y="16" width="8" height="8" fill="url(#headerLogoGradient)" />
      <rect x="8" y="24" width="4" height="4" fill="url(#headerLogoGradient)" />
      <rect x="28" y="24" width="4" height="4" fill="url(#headerLogoGradient)" />
      <rect x="12" y="28" width="4" height="4" fill="url(#headerLogoGradient)" />
      <rect x="24" y="28" width="4" height="4" fill="url(#headerLogoGradient)" />
      <rect x="16" y="32" width="8" height="4" fill="url(#headerLogoGradient)" />
    </svg>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

function getItemId(productId: string, size: string, color: string) {
  return `${productId}-${size}-${color}`;
}

export function Header() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setTheme, resolvedTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { cart, totalItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchParams.get('checkout') === '1' && !isCheckoutOpen) {
      setIsCheckoutOpen(true);
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isCheckoutOpen, setSearchParams]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/catalogo?isNew=true', label: 'Lançamentos' },
    { href: '/minhas-estampas', label: 'Criar Estampa' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.split('?')[0]);
  };

  return (
    <>
      {/* Announcement Bar - estrutura Kimi */}
      <div className="bg-fire h-8 flex items-center justify-center overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="text-white font-heading font-semibold text-sm tracking-wide px-4">
            ⚡ FRETE GRÁTIS acima de R$299 | Use GEEK10 para 10% OFF
          </span>
        </div>
      </div>

      {/* Main Header - estrutura Kimi */}
      <header
        className={`sticky top-0 z-50 h-16 transition-all duration-300 ${
          isScrolled ? 'bg-void/95 backdrop-blur-md border-b border-rim' : 'bg-void'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GeekeriaLogo className="w-8 h-8" />
            <span className="font-display text-2xl text-ink tracking-[0.08em]">
              GEEKERIA
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative font-heading font-semibold uppercase text-sm tracking-wide transition-colors ${
                  isActive(link.href) ? 'text-fire' : 'text-ink-2 hover:text-fire'
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-fire transition-transform duration-200 origin-left ${
                    isActive(link.href) ? 'scale-x-100' : 'scale-x-0 hover:scale-x-100'
                  }`}
                  style={{ width: '100%' }}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Toggle de tema (next-themes) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
              aria-label={resolvedTheme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            >
              {resolvedTheme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Autenticação - lógica original */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to="/minha-conta"
                  className="hidden sm:flex flex-col items-end text-ink-2 hover:text-fire transition-colors text-sm"
                >
                  <span className="font-heading font-semibold">
                    Olá, {user.name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-success font-body">
                    💳 {user.credits} créditos
                  </span>
                </Link>
                <Link
                  to="/minha-conta"
                  className="sm:hidden w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
                aria-label="Entrar"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            {/* Carrinho - lógica original (useCart, Sheet, CheckoutWithBrick) */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="relative w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
                  aria-label="Carrinho"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-fire text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-void">
                      {totalItems}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-surface border-l-2 border-fire p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-rim">
                  <SheetTitle className="flex items-center gap-3 font-display text-2xl text-ink">
                    <ShoppingBag className="w-6 h-6 text-fire" />
                    SEU ARSENAL
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col flex-1 min-h-0">
                  {cart.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                      <Package className="w-16 h-16 text-ink-4 mb-4" />
                      <p className="text-ink-2 text-center">Seu arsenal está vazio</p>
                      <Link
                        to="/catalogo"
                        onClick={() => setIsCartOpen(false)}
                        className="mt-4 text-fire hover:text-fire-bright font-heading font-semibold"
                      >
                        Explorar Catálogo
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto p-6 space-y-4">
                        {cart.items.map((item) => {
                          const itemId = getItemId(item.product.id, item.size, item.color);
                          return (
                            <div
                              key={itemId}
                              className="flex gap-4 p-3 bg-elevated rounded"
                            >
                              <img
                                src={item.product.image ?? undefined}
                                alt={item.product.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-heading font-semibold text-ink text-sm line-clamp-2">
                                  {item.product.name}
                                </h4>
                                <p className="text-ink-3 text-xs mt-1">
                                  Tam: {item.size} | Cor: {item.color}
                                </p>
                                <p className="font-display text-fire text-lg mt-1">
                                  {formatPrice(item.product.price)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(itemId, item.quantity - 1)
                                    }
                                    className="w-6 h-6 flex items-center justify-center bg-surface border border-rim rounded hover:border-fire transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center font-heading font-semibold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(itemId, item.quantity + 1)
                                    }
                                    className="w-6 h-6 flex items-center justify-center bg-surface border border-rim rounded hover:border-fire transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(itemId)}
                                    className="ml-auto text-ink-3 hover:text-danger transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-rim p-6 bg-surface space-y-4">
                        {totalItems >= 3 && (
                          <div className="text-center">
                            <span className="inline-flex items-center gap-1.5 bg-fire/10 text-fire rounded-full px-3 py-1.5 text-xs font-medium font-body">
                              Você ganhou{' '}
                              {totalItems >= 5 ? '15%' : totalItems >= 4 ? '10%' : '5%'} de
                              desconto!
                            </span>
                          </div>
                        )}

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-ink-2 font-body">
                              Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                            </span>
                            <span className="font-heading font-semibold text-ink">
                              {formatPrice(cart.subtotal)}
                            </span>
                          </div>
                          {cart.discount > 0 && (
                            <div className="flex justify-between text-fire">
                              <span className="font-body">Desconto</span>
                              <span className="font-body">
                                -{formatPrice(cart.discount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-ink-3 text-xs">
                            <span className="font-body">Frete</span>
                            <span className="font-body">Calculado no checkout</span>
                          </div>
                          <Separator className="bg-rim" />
                          <div className="flex justify-between items-baseline">
                            <span className="font-display text-base text-ink">
                              TOTAL ESTIMADO
                            </span>
                            <span className="font-display text-2xl text-fire">
                              {formatPrice(cart.total)}
                            </span>
                          </div>
                        </div>

                        <TrustBadges variant="cart" />

                        <Button
                          className="w-full btn-fire h-14 text-lg"
                          onClick={() => {
                            setIsCartOpen(false);
                            setIsCheckoutOpen(true);
                          }}
                        >
                          FINALIZAR COMPRA
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-ink-2 hover:text-fire transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-surface border-b border-rim">
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-3 px-4 font-heading font-semibold uppercase text-sm tracking-wide border-b border-rim last:border-0 ${
                    isActive(link.href) ? 'text-fire' : 'text-ink-2'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />

      <CheckoutWithBrick
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}

export default Header;
