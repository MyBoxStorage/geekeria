import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, Minus, Plus, Trash2, User, LogOut } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckoutWithBrick } from '@/components/CheckoutWithBrick';

const navLinks = [
  { name: 'INÍCIO', href: '#hero' },
  { name: 'COLEÇÃO', href: '#featured' },
  { name: 'CATÁLOGO', href: '#catalog' },
  { name: 'SOBRE', href: '#values' },
  { name: 'CONTATO', href: '#footer' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { cart, totalItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('#hero');
            }}
            className="flex items-center gap-2"
          >
            <span
              className={`font-display text-2xl md:text-3xl tracking-wider transition-colors ${
                isScrolled ? 'text-[#00843D]' : 'text-white'
              }`}
            >
              BRAVOS
            </span>
            <span
              className={`font-display text-2xl md:text-3xl tracking-wider transition-colors ${
                isScrolled ? 'text-[#002776]' : 'text-[#FFCC29]'
              }`}
            >
              BRASIL
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
                className={`font-body text-sm font-medium tracking-wider relative group transition-colors ${
                  isScrolled ? 'text-gray-800 hover:text-[#00843D]' : 'text-white hover:text-[#FFCC29]'
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FFCC29] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  to="/minhas-estampas"
                  className={`text-sm hidden sm:block hover:underline ${isScrolled ? 'text-gray-800 hover:text-[#00843D]' : 'text-white hover:text-[#FFCC29]'}`}
                >
                  Minhas Estampas
                </Link>
                <span className={`text-sm hidden sm:block ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                  Olá, {user.name || user.email.split('@')[0]}
                  <br />
                  <span className={`text-xs ${isScrolled ? 'text-green-600' : 'text-green-300'}`}>💳 {user.credits} créditos</span>
                </span>
                <button
                  onClick={logout}
                  className={`p-2 rounded-full transition-colors ${isScrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-white/10 text-white'}`}
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`flex items-center gap-2 p-2 rounded-full transition-colors ${isScrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-white/10 text-white'}`}
              >
                <User size={20} />
                <span className="hidden sm:inline text-sm font-medium">Entrar</span>
              </button>
            )}

            {/* Search */}
            <button
              className={`p-2 rounded-full transition-colors ${
                isScrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button
                  className={`p-2 rounded-full transition-colors relative ${
                    isScrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-[#FFCC29] text-[#002776] text-xs font-bold animate-pulse-slow">
                      {totalItems}
                    </Badge>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl text-[#00843D]">
                    SEU CARRINHO
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-auto py-4">
                  {cart.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="font-body">Seu carrinho está vazio</p>
                      <p className="text-sm mt-2">Adicione produtos para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.items.map((item) => (
                        <div
                          key={`${item.product.id}-${item.size}-${item.color}`}
                          className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-body font-medium text-sm line-clamp-2">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Tam: {item.size} | Cor: {item.color}
                            </p>
                            <p className="font-display text-lg text-[#00843D] mt-1">
                              {formatPrice(item.product.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    `${item.product.id}-${item.size}-${item.color}`,
                                    item.quantity - 1
                                  )
                                }
                                className="w-6 h-6 flex items-center justify-center bg-white border rounded hover:bg-gray-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    `${item.product.id}-${item.size}-${item.color}`,
                                    item.quantity + 1
                                  )
                                }
                                className="w-6 h-6 flex items-center justify-center bg-white border rounded hover:bg-gray-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  removeFromCart(`${item.product.id}-${item.size}-${item.color}`)
                                }
                                className="ml-auto text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.items.length > 0 && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                      </div>
                      {cart.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto</span>
                          <span>-{formatPrice(cart.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frete</span>
                        <span>
                          {cart.shipping === 0
                            ? (cart.items.some((i) => i.product.category === 'TESTES') ? 'Grátis (Teste)' : 'Grátis')
                            : formatPrice(cart.shipping)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-display text-xl text-[#00843D]">
                        <span>TOTAL</span>
                        <span>{formatPrice(cart.total)}</span>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-[#00843D] hover:bg-[#006633] text-white font-display text-lg py-6"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                    >
                      FINALIZAR COMPRA
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500">
                      {totalItems >= 3 && (
                        <span className="text-green-600 font-medium">
                          Você ganhou {totalItems >= 5 ? '15%' : totalItems >= 4 ? '10%' : '5%'} de desconto!
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors ${
                isScrolled ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-white/10 text-white'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-white/20 pt-4">
            <div className="flex flex-col gap-3">
              {user && (
                <Link
                  to="/minhas-estampas"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-body text-sm font-medium tracking-wider py-2 transition-colors ${
                    isScrolled ? 'text-gray-800' : 'text-white'
                  }`}
                >
                  Minhas Estampas
                </Link>
              )}
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className={`font-body text-sm font-medium tracking-wider py-2 transition-colors ${
                    isScrolled ? 'text-gray-800' : 'text-white'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />

      {/* Checkout Dialog com Payment Brick */}
      <CheckoutWithBrick
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </header>
  );
}
