import { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  ChevronLeft,
  LogOut,
  Package,
  List,
  FileJson,
  X,
} from 'lucide-react';
import type { Product } from '@/types';

interface ProductAdminProps {
  onLogout: () => void;
}

type TabId = 'list' | 'add' | 'export';

interface DraftImage {
  id: string;
  file: File;
  preview: string;
}

interface DraftProduct {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  badge: string;
  isNew: boolean;
  isBestseller: boolean;
  rating: string;
  reviews: string;
}

const CATEGORIES = [
  { id: 'camisetas', name: 'Camisetas' },
  { id: 'bone', name: 'Bonés' },
  { id: 'moletom', name: 'Moletons' },
  { id: 'polo', name: 'Polos' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'acessorios', name: 'Acessórios' },
  { id: 'TESTES', name: 'Testes' },
];

const ALL_SIZES = ['P', 'M', 'G', 'GG', 'XG'];
const ALL_COLORS = [
  { id: 'preto', name: 'Preto', hex: '#000' },
  { id: 'branco', name: 'Branco', hex: '#fff' },
  { id: 'verde', name: 'Verde', hex: '#00843D' },
  { id: 'azul', name: 'Azul', hex: '#002776' },
  { id: 'cinza', name: 'Cinza', hex: '#666' },
  { id: 'amarelo', name: 'Amarelo', hex: '#FFCC29' },
];

const emptyDraft: DraftProduct = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  image: '',
  category: 'camisetas',
  sizes: [],
  colors: [],
  badge: '',
  isNew: false,
  isBestseller: false,
  rating: '4.8',
  reviews: '0',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ─── Styles ─── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e0e0e0',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,
  header: {
    background: '#111',
    borderBottom: '1px solid #222',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  } as React.CSSProperties,
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 22,
    letterSpacing: 2,
    color: '#fff',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: 4,
    background: '#161616',
    borderRadius: 8,
    padding: 4,
  } as React.CSSProperties,
  tab: (active: boolean) =>
    ({
      padding: '8px 16px',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: active ? '#00843D' : 'transparent',
      color: active ? '#fff' : '#888',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
  card: {
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.5,
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#222',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '10px 14px',
    background: '#222',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
    minHeight: 80,
    resize: 'vertical' as const,
  } as React.CSSProperties,
  btnPrimary: {
    padding: '12px 24px',
    background: '#00843D',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 16,
    letterSpacing: 2,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  btnDanger: {
    padding: '6px 12px',
    background: '#331111',
    color: '#cc4444',
    border: '1px solid #441111',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,
  sizeBtn: (active: boolean) =>
    ({
      width: 40,
      height: 40,
      borderRadius: 6,
      border: `2px solid ${active ? '#00843D' : '#333'}`,
      background: active ? '#00843D' : 'transparent',
      color: active ? '#fff' : '#888',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "'Inter', sans-serif",
    }) as React.CSSProperties,
  colorBtn: (active: boolean, hex: string) =>
    ({
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: `3px solid ${active ? '#00843D' : '#333'}`,
      background: hex,
      cursor: 'pointer',
      boxShadow: active ? '0 0 0 2px #00843D40' : 'none',
    }) as React.CSSProperties,
  dropzone: (isDragOver: boolean) =>
    ({
      border: `2px dashed ${isDragOver ? '#00843D' : '#333'}`,
      borderRadius: 12,
      padding: 32,
      textAlign: 'center' as const,
      cursor: 'pointer',
      background: isDragOver ? '#00843D10' : '#111',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
  toast: {
    position: 'fixed' as const,
    bottom: 24,
    right: 24,
    background: '#00843D',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
    animation: 'fadeIn 0.3s ease',
  } as React.CSSProperties,
};

export default function ProductAdmin({ onLogout }: ProductAdminProps) {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<DraftProduct>({ ...emptyDraft });
  const [images, setImages] = useState<DraftImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newImages: DraftImage[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
      }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleSave = () => {
    if (!draft.name || !draft.price || !draft.category) {
      showToast('Preencha nome, preço e categoria');
      return;
    }

    const slug = generateSlug(draft.name);
    const imagePath =
      images.length > 0
        ? `/products/${slug}_01.webp`
        : draft.image || '/products/placeholder.webp';

    const product: Product = {
      id: editingId || generateId(),
      name: draft.name,
      description: draft.description,
      price: parseFloat(draft.price) || 0,
      originalPrice: draft.originalPrice
        ? parseFloat(draft.originalPrice)
        : undefined,
      image: imagePath,
      category: draft.category,
      sizes: draft.sizes,
      colors: draft.colors,
      rating: parseFloat(draft.rating) || 4.8,
      reviews: parseInt(draft.reviews, 10) || 0,
      badge: draft.badge || undefined,
      isNew: draft.isNew || undefined,
      isBestseller: draft.isBestseller || undefined,
    };

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? product : p))
      );
      showToast('Produto atualizado!');
    } else {
      setProducts((prev) => [...prev, product]);
      showToast('Produto adicionado!');
    }

    setDraft({ ...emptyDraft });
    setImages([]);
    setEditingId(null);
    setActiveTab('list');
  };

  const handleEdit = (product: Product) => {
    setDraft({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      image: product.image,
      category: product.category,
      sizes: product.sizes,
      colors: product.colors,
      badge: product.badge || '',
      isNew: product.isNew || false,
      isBestseller: product.isBestseller || false,
      rating: product.rating.toString(),
      reviews: product.reviews.toString(),
    });
    setEditingId(product.id);
    setActiveTab('add');
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produto removido');
  };

  const toggleSize = (size: string) => {
    setDraft((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleColor = (color: string) => {
    setDraft((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const exportJson = () => {
    const json = JSON.stringify(products, null, 2);
    return `// Generated by Bravos Brasil Admin - ${new Date().toLocaleDateString('pt-BR')}\n// Paste into src/data/products.ts\n\nimport type { Product } from '@/types';\n\nexport const allProducts: Product[] = ${json};\n`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportJson());
    setCopied(true);
    showToast('JSON copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={s.logo}>
            BRAVOS <span style={{ color: '#FFCC29' }}>ADMIN</span>
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#00843D',
              background: '#00843D20',
              padding: '2px 10px',
              borderRadius: 20,
              fontWeight: 600,
            }}
          >
            Produtos
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={s.tabs}>
            {(
              [
                { id: 'list' as TabId, icon: List, label: 'Produtos' },
                { id: 'add' as TabId, icon: Plus, label: editingId ? 'Editar' : 'Novo' },
                { id: 'export' as TabId, icon: FileJson, label: 'Exportar' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                style={s.tab(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#666',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        {/* ─── TAB: LIST ─── */}
        {activeTab === 'list' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 28,
                  letterSpacing: 2,
                  color: '#fff',
                }}
              >
                PRODUTOS ({products.length})
              </h2>
              <button
                style={s.btnPrimary}
                onClick={() => {
                  setDraft({ ...emptyDraft });
                  setEditingId(null);
                  setImages([]);
                  setActiveTab('add');
                }}
              >
                <Plus size={16} />
                NOVO PRODUTO
              </button>
            </div>

            {products.length === 0 ? (
              <div
                style={{
                  ...s.card,
                  textAlign: 'center',
                  padding: 48,
                  color: '#555',
                }}
              >
                <Package
                  size={48}
                  style={{ margin: '0 auto 16px', opacity: 0.3 }}
                />
                <p style={{ fontSize: 16, marginBottom: 8 }}>
                  Nenhum produto cadastrado
                </p>
                <p style={{ fontSize: 13 }}>
                  Clique em "Novo Produto" para adicionar
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      ...s.card,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        background: '#222',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <ImageIcon size={24} color="#444" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: '#fff',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#666',
                          display: 'flex',
                          gap: 12,
                        }}
                      >
                        <span style={{ color: '#00843D', fontWeight: 600 }}>
                          {formatPrice(product.price)}
                        </span>
                        <span>{product.category}</span>
                        <span>{product.sizes.join(', ')}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={{
                          ...s.btnDanger,
                          background: '#111d33',
                          color: '#4488cc',
                          borderColor: '#223355',
                        }}
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </button>
                      <button
                        style={s.btnDanger}
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: ADD/EDIT ─── */}
        {activeTab === 'add' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                  fontFamily: "'Inter', sans-serif",
                }}
                onClick={() => setActiveTab('list')}
              >
                <ChevronLeft size={16} />
                Voltar para lista
              </button>
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 28,
                  letterSpacing: 2,
                  color: '#fff',
                  marginTop: 8,
                }}
              >
                {editingId ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
              </h2>
            </div>

            {/* Image Upload */}
            <div style={s.card}>
              <label style={s.label}>Fotos do Produto</label>
              <div
                style={s.dropzone(isDragOver)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload
                  size={32}
                  color={isDragOver ? '#00843D' : '#444'}
                  style={{ margin: '0 auto 12px' }}
                />
                <p style={{ color: '#888', fontSize: 14 }}>
                  Arraste fotos aqui ou clique para selecionar
                </p>
                <p style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
                  JPG, PNG ou WebP
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {images.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  {images.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #333',
                      }}
                    >
                      <img
                        src={img.preview}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#cc0000',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div style={s.card}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>Nome do Produto</label>
                  <input
                    style={s.input}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="T-Shirt Classic - Patriota"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>Descrição</label>
                  <textarea
                    style={s.textarea}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Descrição detalhada do produto..."
                  />
                </div>

                <div>
                  <label style={s.label}>Preço (R$)</label>
                  <input
                    style={s.input}
                    type="number"
                    step="0.01"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="89.90"
                  />
                </div>

                <div>
                  <label style={s.label}>Preço Original (opcional)</label>
                  <input
                    style={s.input}
                    type="number"
                    step="0.01"
                    value={draft.originalPrice}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        originalPrice: e.target.value,
                      }))
                    }
                    placeholder="109.90"
                  />
                </div>

                <div>
                  <label style={s.label}>Categoria</label>
                  <select
                    style={{ ...s.input, cursor: 'pointer' }}
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={s.label}>Badge (opcional)</label>
                  <input
                    style={s.input}
                    value={draft.badge}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, badge: e.target.value }))
                    }
                    placeholder="LANÇAMENTO, -20%, etc"
                  />
                </div>

                <div>
                  <label style={s.label}>Avaliação</label>
                  <input
                    style={s.input}
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={draft.rating}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, rating: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label style={s.label}>N.º de Avaliações</label>
                  <input
                    style={s.input}
                    type="number"
                    value={draft.reviews}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, reviews: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Flags */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#aaa',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={draft.isNew}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, isNew: e.target.checked }))
                    }
                    style={{ accentColor: '#00843D' }}
                  />
                  Novo
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#aaa',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={draft.isBestseller}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        isBestseller: e.target.checked,
                      }))
                    }
                    style={{ accentColor: '#FFCC29' }}
                  />
                  Mais Vendido
                </label>
              </div>
            </div>

            {/* Sizes */}
            <div style={s.card}>
              <label style={s.label}>Tamanhos Disponíveis</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ALL_SIZES.map((size) => (
                  <button
                    key={size}
                    style={s.sizeBtn(draft.sizes.includes(size))}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div style={s.card}>
              <label style={s.label}>Cores Disponíveis</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {ALL_COLORS.map((color) => (
                  <div
                    key={color.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <button
                      style={s.colorBtn(
                        draft.colors.includes(color.id),
                        color.hex
                      )}
                      onClick={() => toggleColor(color.id)}
                      title={color.name}
                    />
                    <span style={{ fontSize: 10, color: '#666' }}>
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image URL fallback */}
            <div style={s.card}>
              <label style={s.label}>
                URL da Imagem (se nenhuma foto enviada)
              </label>
              <input
                style={s.input}
                value={draft.image}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, image: e.target.value }))
                }
                placeholder="/products/nome-do-produto_01.webp"
              />
            </div>

            {/* Save Button */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                marginTop: 8,
              }}
            >
              <button
                style={{
                  ...s.btnPrimary,
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#888',
                }}
                onClick={() => {
                  setDraft({ ...emptyDraft });
                  setImages([]);
                  setEditingId(null);
                  setActiveTab('list');
                }}
              >
                CANCELAR
              </button>
              <button style={s.btnPrimary} onClick={handleSave}>
                <Check size={16} />
                {editingId ? 'ATUALIZAR PRODUTO' : 'SALVAR PRODUTO'}
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: EXPORT ─── */}
        {activeTab === 'export' && (
          <div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 28,
                letterSpacing: 2,
                color: '#fff',
                marginBottom: 20,
              }}
            >
              EXPORTAR JSON
            </h2>

            {products.length === 0 ? (
              <div
                style={{
                  ...s.card,
                  textAlign: 'center',
                  padding: 48,
                  color: '#555',
                }}
              >
                <FileJson
                  size={48}
                  style={{ margin: '0 auto 16px', opacity: 0.3 }}
                />
                <p>Adicione produtos antes de exportar</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...s.card,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                      {products.length} produto
                      {products.length !== 1 ? 's' : ''} pronto
                      {products.length !== 1 ? 's' : ''} para exportar
                    </p>
                    <p style={{ color: '#666', fontSize: 13 }}>
                      Cole o JSON em{' '}
                      <code
                        style={{
                          background: '#222',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        src/data/products.ts
                      </code>
                    </p>
                  </div>
                  <button style={s.btnPrimary} onClick={handleCopy}>
                    {copied ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                    {copied ? 'COPIADO!' : 'COPIAR JSON'}
                  </button>
                </div>

                <div style={s.card}>
                  <pre
                    style={{
                      background: '#111',
                      border: '1px solid #222',
                      borderRadius: 8,
                      padding: 16,
                      overflow: 'auto',
                      maxHeight: 400,
                      fontSize: 12,
                      color: '#aaa',
                      fontFamily: "'Fira Code', 'Consolas', monospace",
                      lineHeight: 1.6,
                    }}
                  >
                    {exportJson()}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={s.toast}>
          <Check size={16} />
          {toastMsg}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
