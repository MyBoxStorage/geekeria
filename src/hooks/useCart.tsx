import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import type { Cart, CartItem, Product } from '@/types';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number, size: string, color: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bb_cart_v1';

interface PersistedCartV1 {
  version: 1;
  items: CartItem[];
  updatedAt: number;
}

/** Tenta ler e validar o carrinho salvo no localStorage */
function loadPersistedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as PersistedCartV1).version !== 1 ||
      !Array.isArray((parsed as PersistedCartV1).items)
    ) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    const { items } = parsed as PersistedCartV1;

    const valid = items.filter(
      (it) =>
        it &&
        typeof it === 'object' &&
        it.product &&
        typeof it.product.id === 'string' &&
        typeof it.quantity === 'number' &&
        it.quantity > 0 &&
        typeof it.size === 'string' &&
        typeof it.color === 'string',
    );

    if (valid.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }

    return valid;
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

const calculateDiscount = (itemCount: number): number => {
  if (itemCount >= 5) return 0.15;
  if (itemCount === 4) return 0.10;
  if (itemCount === 3) return 0.05;
  return 0;
};

const generateItemId = (productId: string, size: string, color: string): string => {
  return `${productId}-${size}-${color}`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadPersistedCart);
  const isInitialMount = useRef(true);

  // Persistir items no localStorage a cada mudança (pula o mount inicial para evitar write redundante)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      const payload: PersistedCartV1 = { version: 1, items, updatedAt: Date.now() };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    }
  }, [items]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = useCallback((product: Product, quantity: number, size: string, color: string) => {
    const itemId = generateItemId(product.id, size, color);
    
    setItems((prev) => {
      const existingItem = prev.find((item) => 
        generateItemId(item.product.id, item.size, item.color) === itemId
      );
      
      if (existingItem) {
        return prev.map((item) =>
          generateItemId(item.product.id, item.size, item.color) === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prev, { product, quantity, size, color }];
    });
    
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => 
      generateItemId(item.product.id, item.size, item.color) !== itemId
    ));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        generateItemId(item.product.id, item.size, item.color) === itemId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem('bb_order_pending');
    localStorage.removeItem('bb_order_pending_v1');
  }, []);

  const cart = useMemo<Cart>(() => {
    const subtotal = items.reduce((sum, item) => 
      sum + item.product.price * item.quantity, 0
    );
    
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const discountRate = calculateDiscount(totalItems);
    const discount = subtotal * discountRate;
    const shipping = subtotal > 200 ? 0 : 15;
    const total = subtotal - discount + shipping;
    
    return {
      items,
      subtotal,
      discount,
      shipping,
      total,
    };
  }, [items]);

  const totalItems = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0),
  [items]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
