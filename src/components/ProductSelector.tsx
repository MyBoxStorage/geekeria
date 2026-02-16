import { useState, useEffect } from 'react';
import { apiConfig } from '@/config/api';
import { allProducts, categories } from '@/data/products';
import type { Product } from '@/types';

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  categories.filter((c) => c.id !== 'all').map((c) => [c.id, c.name])
);

interface ProductSelectorProps {
  generationId: string;
  onAddToCart: (data: {
    product: Product;
    size: string;
    color: string;
    quantity: number;
    generationId: string;
    couponCode?: string;
    discount?: number;
  }) => void;
}

export function ProductSelector({
  generationId,
  onAddToCart,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    setProducts(allProducts);
    const grouped = allProducts.reduce<Record<string, Product[]>>((acc, p) => {
      const cat = p.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
    setGroupedProducts(grouped);
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '');
    setSelectedColor(product.colors[0] || '');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const res = await fetch(`${apiConfig.baseURL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Cupom inválido');
        return;
      }

      const discount =
        data.coupon.type === 'PERCENTAGE' ? data.coupon.value : 0;

      setCouponDiscount(discount);
      alert(`Cupom aplicado! ${discount}% de desconto`);
    } catch (error) {
      console.error('Error validating coupon:', error);
      alert('Erro ao validar cupom');
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const subtotal = selectedProduct.price * quantity;
    const discount = (subtotal * couponDiscount) / 100;
    return subtotal - discount;
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedSize || !selectedColor) {
      alert('Selecione produto, tamanho e cor');
      return;
    }

    onAddToCart({
      product: selectedProduct,
      size: selectedSize,
      color: selectedColor,
      quantity,
      generationId,
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      discount: couponDiscount,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-4">
        🎨 Escolha o Produto para Personalizar
      </h3>

      {/* Seletor de Produto */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Produto</label>
        <select
          value={selectedProduct?.id || ''}
          onChange={(e) => {
            const product = products.find((p) => p.id === e.target.value);
            if (product) handleProductSelect(product);
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg"
        >
          <option value="">Selecione um produto</option>
          {Object.entries(groupedProducts).map(([category, items]) => (
            <optgroup
              key={category}
              label={CATEGORY_LABELS[category] ?? category}
            >
              {items.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - R$ {product.price.toFixed(2)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Mockup do produto selecionado */}
        {selectedProduct && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full max-w-xs mx-auto rounded-lg object-contain"
            />
          </div>
        )}
      </div>

      {selectedProduct && (
        <>
          {/* Tamanho */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tamanho</label>
            <div className="flex gap-2 flex-wrap">
              {selectedProduct.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    selectedSize === size
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {selectedProduct.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    selectedColor === color
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(parseInt(e.target.value, 10) || 1)
              }
              className="w-32 border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          {/* Cupom */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Cupom de Desconto (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Digite o código"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              />
              <button
                onClick={handleApplyCoupon}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
            {couponDiscount > 0 && (
              <p className="text-green-600 text-sm mt-2">
                ✅ Cupom aplicado: {couponDiscount}% de desconto
              </p>
            )}
          </div>

          {/* Total */}
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">
                R$ {(selectedProduct.price * quantity).toFixed(2)}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between items-center mb-2 text-green-600">
                <span>Desconto ({couponDiscount}%):</span>
                <span>
                  - R${' '}
                  {(
                    (selectedProduct.price *
                      quantity *
                      couponDiscount) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botão Adicionar */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
          >
            🛒 Adicionar ao Carrinho
          </button>
        </>
      )}
    </div>
  );
}
