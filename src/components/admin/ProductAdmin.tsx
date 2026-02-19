import { useState, useRef, useCallback, useEffect } from 'react';
import { getAdminToken } from '@/hooks/useAdminAuth';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  List,
  FileJson,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { Product } from '@/types';
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadImage,
  adminGetCatalogHealth,
  type AdminProductSummary,
  type CatalogHealthCounts,
  type CatalogHealthItem,
} from '@/services/adminProducts';
import {
  buildProductPayload,
  collectFilesToUpload,
  type UploadedUrlsMap,
} from '@/utils/productPayload';
import { invalidateCatalogCache } from '@/hooks/useCatalogProducts';

interface ProductAdminProps {
  onLogout: () => void;
}

type TabId = 'list' | 'add' | 'export';

interface DraftImage {
  id: string;
  file?: File;
  preview: string;
  type: 'model' | 'product' | 'detail';
  gender?: 'masculino' | 'feminino';
  isMain: boolean;
}

interface DraftProduct {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  image: string;
  category: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  sizes: string[];
  colors: string[];
  colorStock: ColorStock[];
  badge: string;
  isNew: boolean;
  isBestseller: boolean;
  rating: string;
  reviews: string;
  metaTitle: string;
  metaDescription: string;
  seoTags: string[];
}

const CATEGORIES = [
  { id: 'camisetas', name: 'Camisetas' },
  { id: 'bone', name: 'Bonés' },
  { id: 'moletom', name: 'Moletons' },
  { id: 'polo', name: 'Polos' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'acessorios', name: 'Acessórios' },
];

const PRODUCT_COLORS = [
  { id: 'vinho',           name: 'Vinho',           hex: '#722F37' },
  { id: 'verde-musgo',     name: 'Verde Musgo',     hex: '#4A5C45' },
  { id: 'verde-bandeira',  name: 'Verde Bandeira',  hex: '#00843D' },
  { id: 'roxo',            name: 'Roxo',            hex: '#6B3FA0' },
  { id: 'rosa-pink',       name: 'Rosa Pink',       hex: '#FF69B4' },
  { id: 'preto',           name: 'Preto',           hex: '#111111' },
  { id: 'laranja',         name: 'Laranja',         hex: '#FF6B00' },
  { id: 'cinza-mescla',    name: 'Cinza Mescla',    hex: '#9E9E9E' },
  { id: 'cinza-chumbo',    name: 'Cinza Chumbo',    hex: '#555555' },
  { id: 'branco',          name: 'Branco',          hex: '#F5F5F5' },
  { id: 'azul-turquesa',   name: 'Azul Turquesa',   hex: '#00BCD4' },
  { id: 'azul-royal',      name: 'Azul Royal',      hex: '#4169E1' },
  { id: 'azul-marinho',    name: 'Azul Marinho',    hex: '#002776' },
  { id: 'amarelo-ouro',    name: 'Amarelo Ouro',    hex: '#FFCC29' },
  { id: 'amarelo-canario', name: 'Amarelo Canário', hex: '#FFE135' },
] as const;

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;
type SizeName = (typeof SIZES)[number];
type ColorId = (typeof PRODUCT_COLORS)[number]['id'];

const DRAFT_STORAGE_KEY = 'bb_admin_draft_v1';

interface GenderStock {
  enabled: boolean;
  sizes: Record<SizeName, boolean>;
}

interface ColorStock {
  colorId: ColorId;
  image: DraftImage | null;
  feminino: GenderStock;
  masculino: GenderStock;
}

function emptyGenderStock(): GenderStock {
  return {
    enabled: false,
    sizes: { PP: false, P: false, M: false, G: false, GG: false, XG: false },
  };
}

function emptyColorStock(colorId: ColorId): ColorStock {
  return {
    colorId,
    image: null,
    feminino: emptyGenderStock(),
    masculino: emptyGenderStock(),
  };
}

const emptyDraft: DraftProduct = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  image: '',
  category: 'camisetas',
  gender: 'unissex',
  sizes: [],
  colors: [],
  colorStock: PRODUCT_COLORS.map((c) => emptyColorStock(c.id)),
  badge: '',
  isNew: false,
  isBestseller: false,
  rating: '4.8',
  reviews: '0',
  metaTitle: '',
  metaDescription: '',
  seoTags: [],
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

/* ─── ColorStockCard (one card per color) ─── */
function ColorStockCard({
  cs,
  color,
  onUpdate,
  onUpdateGender,
  onToggleSize,
  onImageUpload,
}: {
  cs: ColorStock;
  color: (typeof PRODUCT_COLORS)[number];
  onUpdate: (patch: Partial<ColorStock>) => void;
  onUpdateGender: (gender: 'feminino' | 'masculino', patch: Partial<GenderStock>) => void;
  onToggleSize: (gender: 'feminino' | 'masculino', size: SizeName) => void;
  onImageUpload: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const active = cs.feminino.enabled || cs.masculino.enabled;

  return (
    <div
      style={{
        border: `2px solid ${active ? color.hex : '#222'}`,
        borderRadius: 10,
        padding: 12,
        background: active ? `${color.hex}08` : '#0f0f0f',
        transition: 'all 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: color.hex,
          border: color.hex === '#F5F5F5' ? '1px solid #444' : 'none', flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#fff' : '#555', flex: 1 }}>
          {color.name}
        </span>
      </div>

      {/* Photo upload */}
      <div
        style={{
          border: `1px dashed ${cs.image ? color.hex : '#333'}`,
          borderRadius: 8, marginBottom: 10, cursor: 'pointer', overflow: 'hidden',
          aspectRatio: cs.image ? '3/4' : 'auto', minHeight: cs.image ? 'auto' : 56,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0a', position: 'relative',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {cs.image ? (
          <>
            <img src={cs.image.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              style={{
                position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)',
                color: '#fff', border: 'none', borderRadius: '50%',
                width: 20, height: 20, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={(e) => { e.stopPropagation(); onUpdate({ image: null }); }}
            >✕</button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <div style={{ fontSize: 18 }}>📸</div>
            <div style={{ fontSize: 9, color: '#444', marginTop: 2 }}>foto {color.name}</div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onImageUpload(e.target.files)} />
      </div>

      {/* Gender sections */}
      {(['feminino', 'masculino'] as const).map((gender) => (
        <div
          key={gender}
          style={{
            marginBottom: gender === 'feminino' ? 8 : 0,
            padding: '8px 10px', borderRadius: 8,
            background: cs[gender].enabled ? '#ffffff08' : 'transparent',
            border: `1px solid ${cs[gender].enabled ? '#333' : '#1a1a1a'}`,
          }}
        >
          {/* Gender toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cs[gender].enabled ? 8 : 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cs[gender].enabled ? '#fff' : '#444' }}>
              {gender === 'feminino' ? '♀ Feminino' : '♂ Masculino'}
            </span>
            <button
              onClick={() => onUpdateGender(gender, { enabled: !cs[gender].enabled })}
              style={{
                width: 32, height: 18, borderRadius: 9,
                background: cs[gender].enabled ? color.hex : '#333',
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: cs[gender].enabled ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Sizes (only when gender enabled) */}
          {cs[gender].enabled && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => onToggleSize(gender, size)}
                  style={{
                    padding: '3px 7px', borderRadius: 5,
                    border: `1px solid ${cs[gender].sizes[size] ? color.hex : '#333'}`,
                    background: cs[gender].sizes[size] ? color.hex : 'transparent',
                    color: cs[gender].sizes[size] ? '#fff' : '#555',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── ColorStockSection (15 color cards) ─── */
function ColorStockSection({
  colorStock,
  onChange,
}: {
  colorStock: ColorStock[];
  onChange: (updated: ColorStock[]) => void;
}) {
  const updateColor = (colorId: ColorId, patch: Partial<ColorStock>) => {
    onChange(colorStock.map((cs) => (cs.colorId === colorId ? { ...cs, ...patch } : cs)));
  };

  const updateGenderStock = (colorId: ColorId, gender: 'feminino' | 'masculino', patch: Partial<GenderStock>) => {
    const cs = colorStock.find((c) => c.colorId === colorId)!;
    updateColor(colorId, { [gender]: { ...cs[gender], ...patch } });
  };

  const toggleSize = (colorId: ColorId, gender: 'feminino' | 'masculino', size: SizeName) => {
    const cs = colorStock.find((c) => c.colorId === colorId)!;
    updateGenderStock(colorId, gender, {
      sizes: { ...cs[gender].sizes, [size]: !cs[gender].sizes[size] },
    });
  };

  const handleImageUpload = (colorId: ColorId, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const image: DraftImage = {
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      type: 'product',
      gender: undefined,
      isMain: false,
    };
    updateColor(colorId, { image });
  };

  const activeCount = colorStock.filter((cs) => cs.feminino.enabled || cs.masculino.enabled).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 0.5 }}>🎨 Cores e Estoque</span>
        {activeCount > 0 && (
          <span style={{ fontSize: 10, background: '#00843D20', color: '#00843D', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            {activeCount} cor{activeCount !== 1 ? 'es' : ''} ativa{activeCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {PRODUCT_COLORS.map((color) => {
          const cs = colorStock.find((c) => c.colorId === color.id)!;
          return (
            <ColorStockCard
              key={color.id}
              cs={cs}
              color={color}
              onUpdate={(patch) => updateColor(color.id, patch)}
              onUpdateGender={(gender, patch) => updateGenderStock(color.id, gender, patch)}
              onToggleSize={(gender, size) => toggleSize(color.id, gender, size)}
              onImageUpload={(files) => handleImageUpload(color.id, files)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── UploadZone (single typed drop area) ─── */
function UploadZone({
  label,
  hint,
  color,
  photos,
  inputRef,
  onDrop,
  onRemove,
  onSetMain,
  badge,
}: {
  label: string;
  hint: string;
  color: string;
  photos: DraftImage[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (files: FileList) => void;
  onRemove: (id: string) => void;
  onSetMain: (id: string) => void;
  badge: string | null;
}) {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 0.5 }}>{label}</span>
        {badge && (
          <span style={{ fontSize: 10, background: `${color}20`, color, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            {badge}
          </span>
        )}
      </div>
      <div
        style={{
          border: `2px dashed ${dragActive ? color : '#333'}`,
          borderRadius: 10,
          padding: photos.length > 0 ? '10px' : '20px 12px',
          textAlign: 'center' as const,
          background: dragActive ? `${color}08` : '#0f0f0f',
          cursor: 'pointer',
          transition: 'all 0.2s',
          minHeight: 80,
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); onDrop(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        {photos.length === 0 ? (
          <>
            <div style={{ fontSize: 24, marginBottom: 4 }}>📸</div>
            <div style={{ fontSize: 11, color: '#555' }}>{hint}</div>
            <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>Arraste ou clique</div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
            {photos.map((img) => (
              <div key={img.id} style={{ position: 'relative' }}>
                <img
                  src={img.preview}
                  alt=""
                  style={{
                    width: '100%', aspectRatio: '3/4', objectFit: 'cover',
                    borderRadius: 6, border: `2px solid ${img.isMain ? color : '#333'}`, display: 'block',
                  }}
                />
                {img.isMain && (
                  <span style={{
                    position: 'absolute', top: 3, left: 3, background: color, color: '#fff',
                    fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                  }}>CAPA</span>
                )}
                <button
                  style={{
                    position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.7)',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18,
                    cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                >✕</button>
                {!img.isMain && (
                  <button
                    style={{
                      position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: 3,
                      padding: '1px 5px', cursor: 'pointer', fontSize: 8, whiteSpace: 'nowrap' as const,
                    }}
                    onClick={(e) => { e.stopPropagation(); onSetMain(img.id); }}
                  >★ capa</button>
                )}
              </div>
            ))}
            <div style={{
              aspectRatio: '3/4', border: '1px dashed #333', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 20,
            }}>+</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && onDrop(e.target.files)}
        />
      </div>
    </div>
  );
}

/* ─── ImageUploadSection (model + color stock + detail) ─── */
function ImageUploadSection({
  images,
  onImagesAdd,
  onImageRemove,
  onSetMain,
  gender,
  colorStock,
  onColorStockChange,
  keepConfeccao,
  setKeepConfeccao,
  confeccaoCache,
  setConfeccaoCache,
}: {
  images: DraftImage[];
  onImagesAdd: (imgs: DraftImage[]) => void;
  onImageRemove: (id: string) => void;
  onSetMain: (id: string) => void;
  gender: 'masculino' | 'feminino' | 'unissex';
  colorStock: ColorStock[];
  onColorStockChange: (updated: ColorStock[]) => void;
  keepConfeccao: boolean;
  setKeepConfeccao: React.Dispatch<React.SetStateAction<boolean>>;
  confeccaoCache: { colorStock: ColorStock[]; gender: string } | null;
  setConfeccaoCache: React.Dispatch<React.SetStateAction<{ colorStock: ColorStock[]; gender: string } | null>>;
}) {
  const inputRefMasc = useRef<HTMLInputElement>(null);
  const inputRefFem = useRef<HTMLInputElement>(null);
  const inputRefDetail = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList, type: DraftImage['type'], imgGender?: DraftImage['gender']) => {
    const imgs: DraftImage[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        type,
        gender: imgGender,
        isMain: false,
      }));
    onImagesAdd(imgs);
  };

  const photosMasc = images.filter((i) => i.type === 'model' && i.gender === 'masculino');
  const photosFem = images.filter((i) => i.type === 'model' && i.gender === 'feminino');
  const photosDetail = images.filter((i) => i.type === 'detail');

  const showMasc = gender !== 'feminino';
  const showFem = gender !== 'masculino';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Model photos */}
      <div style={{ display: 'grid', gridTemplateColumns: showMasc && showFem ? '1fr 1fr' : '1fr', gap: 12 }}>
        {showMasc && (
          <UploadZone
            label="♂ Modelo Masculino"
            hint="Foto do modelo homem usando a peça"
            color="#002776"
            photos={photosMasc}
            inputRef={inputRefMasc}
            onDrop={(files) => processFiles(files, 'model', 'masculino')}
            onRemove={onImageRemove}
            onSetMain={onSetMain}
            badge={photosMasc.length > 0 ? `${photosMasc.length} foto(s)` : null}
          />
        )}
        {showFem && (
          <UploadZone
            label="♀ Modelo Feminina"
            hint="Foto da modelo mulher usando a peça"
            color="#00843D"
            photos={photosFem}
            inputRef={inputRefFem}
            onDrop={(files) => processFiles(files, 'model', 'feminino')}
            onRemove={onImageRemove}
            onSetMain={onSetMain}
            badge={photosFem.length > 0 ? `${photosFem.length} foto(s)` : null}
          />
        )}
      </div>

      {/* Toggle cache de confecção */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <p className="text-sm font-medium text-zinc-200">
            Manter confecção para o próximo produto
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {keepConfeccao && confeccaoCache
              ? 'Ativo — cores e tamanhos serão carregados no próximo produto'
              : keepConfeccao
              ? 'Ativo — será salvo ao concluir este produto'
              : 'Desativado — confecção será limpa após salvar'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setKeepConfeccao((prev) => {
              const next = !prev;
              if (!next) {
                setConfeccaoCache(null);
                localStorage.removeItem('bb_admin_confeccao_cache');
              }
              return next;
            });
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            keepConfeccao ? 'bg-green-500' : 'bg-zinc-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              keepConfeccao ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Color stock section (replaces generic "Produto por Cor") */}
      <ColorStockSection colorStock={colorStock} onChange={onColorStockChange} />

      {/* Detail / Print photos */}
      <UploadZone
        label="🔍 Detalhe / Estampa"
        hint="Close-up da estampa ou acabamento"
        color="#888"
        photos={photosDetail}
        inputRef={inputRefDetail}
        onDrop={(files) => processFiles(files, 'detail')}
        onRemove={onImageRemove}
        onSetMain={onSetMain}
        badge={photosDetail.length > 0 ? `${photosDetail.length} foto(s)` : null}
      />

      {/* Status banner for unissex */}
      {gender === 'unissex' && (() => {
        const okMasc = photosMasc.length > 0;
        const okFem = photosFem.length > 0;
        if (okMasc && okFem) return (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#00843D15', border: '1px solid #00843D40',
            fontSize: 12, color: '#00843D',
          }}>
            ✅ Toggle ativo — o catálogo vai alternar entre ♂ e ♀ ao passar o mouse
          </div>
        );
        return (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#FFCC2915', border: '1px solid #FFCC2940',
            fontSize: 12, color: '#FFCC29',
          }}>
            ⚠️ Produto unissex — adicione foto{' '}
            {!okMasc && '♂ masculino'}
            {!okMasc && !okFem && ' e '}
            {!okFem && '♀ feminino'}
            {' '}para ativar o toggle no catálogo
          </div>
        );
      })()}
    </div>
  );
}

const ISSUE_LABELS: Record<string, string> = {
  MISSING_SLUG: 'Sem slug (link)',
  MISSING_IMAGE: 'Sem imagem',
  INVALID_PRICE: 'Preço inválido',
  INVALID_CATEGORY: 'Categoria vazia',
  INVALID_COLOR_STOCK: 'Estoque (cor/tamanho) inválido',
  DERIVED_MISMATCH: 'Sizes/colors vazios',
  TEST_CATEGORY: 'TESTE (não aparece no catálogo)',
};

function issueLabel(code: string): string {
  return ISSUE_LABELS[code] ?? code;
}

function loadDraftFromStorage(): { draft: DraftProduct; editingId: string | null } | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.draft?.name && !parsed?.editingId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function ProductAdmin({ onLogout }: ProductAdminProps) {
  const _savedDraft = loadDraftFromStorage();
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<DraftProduct>(
    _savedDraft?.draft ?? { ...emptyDraft }
  );
  const [images, setImages] = useState<DraftImage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(
    _savedDraft?.editingId ?? null
  );
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [healthCounts, setHealthCounts] = useState<CatalogHealthCounts | null>(null);
  const [healthItems, setHealthItems] = useState<CatalogHealthItem[]>([]);
  const [healthOpen, setHealthOpen] = useState(false);
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(
    () => loadDraftFromStorage() !== null
  );

  const [keepConfeccao, setKeepConfeccao] = useState<boolean>(() => {
    return localStorage.getItem('bb_admin_keep_confeccao') === 'true';
  });

  const [confeccaoCache, setConfeccaoCache] = useState<{
    colorStock: ColorStock[];
    gender: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('bb_admin_confeccao_cache');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auto-salva rascunho enquanto o admin edita
  useEffect(() => {
    const hasContent = draft.name || draft.price || draft.description || editingId;
    if (!hasContent) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ draft, editingId })
      );
    } catch {
      // silently fail (quota exceeded, etc)
    }
  }, [draft, editingId]);

  useEffect(() => {
    localStorage.setItem('bb_admin_keep_confeccao', String(keepConfeccao));
  }, [keepConfeccao]);

  const getToken = () => getAdminToken() || '';

  // ── Load products from backend on mount ──
  const loadProducts = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setIsLoadingList(true);
    try {
      const res = await adminListProducts(token, 100, 0);
      if (res.ok && res.products) {
        const mapped: Product[] = res.products.map((p: AdminProductSummary) => ({
          id: p.id,
          name: p.name,
          description: '',
          price: p.price,
          image: p.image,
          category: p.category,
          gender: (p.gender as Product['gender']) || 'unissex',
          sizes: [],
          colors: [],
          rating: 0,
          reviews: 0,
          isNew: p.isNew,
          isBestseller: p.isBestseller,
          slug: p.slug,
        }));
        setProducts(mapped);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load products:', err);
      showToast('Falha ao carregar produtos. Tente novamente.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await adminGetCatalogHealth(token);
      if (res.ok) {
        setHealthCounts(res.counts);
        setHealthItems(res.items);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load catalog health:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadHealth();
  }, [loadProducts, loadHealth]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleImagesAdd = useCallback((newImgs: DraftImage[]) => {
    setImages((prev) => [...prev, ...newImgs]);
  }, []);

  const handleImageRemove = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleSetMain = useCallback((id: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isMain: img.id === id })));
  }, []);

  const handleSave = async () => {
    if (!draft.name || !draft.price || !draft.category) {
      showToast('Preencha nome, preço e categoria');
      return;
    }

    const token = getToken();
    if (!token) {
      showToast('Token de admin não encontrado.');
      return;
    }

    setIsSaving(true);
    setSaveProgress('Preparando...');

    try {
      const slug = generateSlug(draft.name);
      const productIdForUpload = editingId || slug;

      // 1) Upload pending files (images + color swatch images)
      const filesToUpload = collectFilesToUpload(images, draft.colorStock, slug);
      const uploadedUrls: UploadedUrlsMap = new Map();
      let uploadFailed = false;

      if (filesToUpload.length > 0) {
        setSaveProgress(`Enviando imagens (0/${filesToUpload.length})...`);
        for (let i = 0; i < filesToUpload.length; i++) {
          const { id, file, kind } = filesToUpload[i];
          setSaveProgress(`Enviando imagens (${i + 1}/${filesToUpload.length})...`);
          try {
            const result = await adminUploadImage(token, file, {
              productId: productIdForUpload,
              kind,
            });
            if (result.ok && result.publicUrl) {
              uploadedUrls.set(id, result.publicUrl);
            } else {
              uploadFailed = true;
              showToast(`Falha no upload da imagem (${kind}). Verifique sua conexão e tente novamente.`);
              break;
            }
          } catch (uploadErr) {
            uploadFailed = true;
            if (import.meta.env.DEV) console.error(`Upload failed for ${kind}:`, uploadErr);
            showToast('Falha no upload da imagem. Verifique sua conexão e tente novamente.');
            break;
          }
        }
      }

      if (uploadFailed) {
        setIsSaving(false);
        setSaveProgress('');
        return;
      }

      // 2) Build payload
      setSaveProgress('Salvando produto...');
      const payload = buildProductPayload(draft, images, uploadedUrls, PRODUCT_COLORS);

      // Safety net: block any blob URLs that may have leaked through
      const hasBlobUrl = (obj: unknown): boolean => {
        if (typeof obj === 'string') return obj.startsWith('blob:');
        if (Array.isArray(obj)) return obj.some(hasBlobUrl);
        if (obj && typeof obj === 'object') return Object.values(obj).some(hasBlobUrl);
        return false;
      };

      if (hasBlobUrl(payload)) {
        showToast('Erro: algumas imagens não foram enviadas corretamente. Tente fazer o upload novamente.');
        setIsSaving(false);
        setSaveProgress('');
        return;
      }

      // 3) Create or update
      if (editingId) {
        const res = await adminUpdateProduct(token, editingId, payload as unknown as Record<string, unknown>);
        if (res.ok) {
          showToast('Produto atualizado no banco!');
        }
      } else {
        const res = await adminCreateProduct(token, payload as unknown as Record<string, unknown>);
        if (import.meta.env.DEV) console.log('CREATE RESPONSE:', res);
        if (res.ok) {
          showToast('Produto criado no banco!');
        } else {
          showToast('Falha ao criar produto. Verifique os dados e tente novamente.');
        }
      }

      // 4) Salvar cache de confecção se toggle ativo
      let cacheToApply: { colorStock: ColorStock[]; gender: string } | null = null;
      if (keepConfeccao) {
        cacheToApply = {
          colorStock: (draft.colorStock ?? []).map((cs) => ({ ...cs, image: null })),
          gender: draft.gender,
        };
        setConfeccaoCache(cacheToApply);
        localStorage.setItem('bb_admin_confeccao_cache', JSON.stringify(cacheToApply));
      }

      // 5) Reset form and reload list + health
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      invalidateCatalogCache();
      const baseDraft = { ...emptyDraft };
      if (keepConfeccao && cacheToApply) {
        baseDraft.colorStock = cacheToApply.colorStock.map((cs) => ({ ...cs, image: null }));
        baseDraft.gender = cacheToApply.gender as DraftProduct['gender'];
      }
      setDraft(baseDraft);
      setImages([]);
      setEditingId(null);
      setActiveTab('list');
      await loadProducts();
      loadHealth();
    } catch (err: unknown) {
      const errObj = err as { error?: string; message?: string } | undefined;
      let msg = 'Erro ao salvar produto';
      if (errObj && typeof errObj === 'object') {
        if (errObj.error === 'CATEGORY_NOT_ALLOWED') {
          msg = "Categoria 'TESTES' não é permitida. Escolha outra categoria.";
        } else if (typeof errObj.message === 'string') {
          msg = errObj.message;
        }
      }
      if (import.meta.env.DEV) console.error('handleSave error:', err);
      showToast(msg);
    } finally {
      setIsSaving(false);
      setSaveProgress('');
    }
  };

  const handleEdit = async (product: Product) => {
    const token = getToken();

    // Try to load full product from backend
    let fullProduct = product;
    if (token) {
      try {
        const res = await adminGetProduct(token, product.id);
        if (res.ok && res.product) {
          fullProduct = {
            id: res.product.id,
            name: res.product.name,
            description: res.product.description || '',
            price: res.product.price,
            originalPrice: res.product.originalPrice,
            image: res.product.image,
            images: Array.isArray(res.product.images) ? res.product.images : undefined,
            category: res.product.category,
            gender: (res.product.gender as Product['gender']) || 'unissex',
            sizes: res.product.sizes || [],
            colors: res.product.colors || [],
            rating: res.product.rating,
            reviews: res.product.reviews,
            badge: res.product.badge,
            isNew: res.product.isNew,
            isBestseller: res.product.isBestseller,
            colorStock: Array.isArray(res.product.colorStock) ? res.product.colorStock : undefined,
          } as Product;
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load full product from backend, using list data:', err);
      }
    }

    // Restore colorStock from backend data or legacy _colorStock
    const savedStock = (fullProduct as any).colorStock ?? (fullProduct as any)._colorStock;
    const csArray = Array.isArray(savedStock) ? savedStock : undefined;

    const restoredStock = PRODUCT_COLORS.map((c) => {
      const base = emptyColorStock(c.id);
      if (csArray) {
        const saved = csArray.find((s: any) => s.id === c.id);
        if (saved?.stock) {
          const fem = { ...base.feminino };
          const masc = { ...base.masculino };
          if (saved.stock.feminino?.available) {
            fem.enabled = true;
            (saved.stock.feminino.sizes || []).forEach((sz: string) => {
              if (sz in fem.sizes) fem.sizes[sz as SizeName] = true;
            });
          }
          if (saved.stock.masculino?.available) {
            masc.enabled = true;
            (saved.stock.masculino.sizes || []).forEach((sz: string) => {
              if (sz in masc.sizes) masc.sizes[sz as SizeName] = true;
            });
          }
          // Restore color image as preview (already uploaded URL)
          let colorImage: DraftImage | null = null;
          if (saved.image) {
            colorImage = {
              id: `restored_color_${c.id}`,
              preview: saved.image,
              type: 'product',
              isMain: false,
            };
          }
          return { ...base, image: colorImage, feminino: fem, masculino: masc };
        }
      }
      if (!fullProduct.colors.includes(c.id)) return base;
      const fem = { ...base.feminino, enabled: true };
      const masc = { ...base.masculino, enabled: true };
      fullProduct.sizes.forEach((sz) => {
        if (sz in fem.sizes) { fem.sizes[sz as SizeName] = true; masc.sizes[sz as SizeName] = true; }
      });
      return { ...base, feminino: fem, masculino: masc };
    });

    // Restore model/detail images as DraftImage previews
    const restoredImages: DraftImage[] = [];
    const imgArray = Array.isArray((fullProduct as any).images) ? (fullProduct as any).images : [];
    for (const img of imgArray) {
      if (img?.url && (img.type === 'model' || img.type === 'detail')) {
        restoredImages.push({
          id: `restored_${restoredImages.length}`,
          preview: img.url,
          type: img.type,
          gender: img.gender,
          isMain: restoredImages.length === 0,
        });
      }
    }

    const validCategoryIds = CATEGORIES.map((c) => c.id);
    const safeCategory = validCategoryIds.includes(fullProduct.category)
      ? fullProduct.category
      : CATEGORIES[0].id;

    setDraft({
      name: fullProduct.name,
      description: fullProduct.description,
      price: fullProduct.price.toString(),
      originalPrice: fullProduct.originalPrice?.toString() || '',
      image: fullProduct.image || '',
      category: safeCategory,
      gender: fullProduct.gender || 'unissex',
      sizes: fullProduct.sizes,
      colors: fullProduct.colors,
      colorStock: restoredStock,
      badge: fullProduct.badge || '',
      isNew: fullProduct.isNew || false,
      isBestseller: fullProduct.isBestseller || false,
      rating: (fullProduct.rating ?? 0).toString(),
      reviews: (fullProduct.reviews ?? 0).toString(),
      metaTitle: (fullProduct as any).metaTitle || '',
      metaDescription: (fullProduct as any).metaDescription || '',
      seoTags: Array.isArray((fullProduct as any).seoTags) ? (fullProduct as any).seoTags : [],
    });
    setImages(restoredImages);
    setEditingId(fullProduct.id);
    setActiveTab('add');
    setRestoredFromDraft(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este produto?')) return;
    try {
      const token = getToken();
      if (!token) {
        showToast('Token de admin não encontrado.');
        return;
      }
      const result = await adminDeleteProduct(token, id);
      if (result.action === 'archived') {
        showToast('Produto arquivado (possui pedidos vinculados)');
      } else {
        showToast('Produto removido com sucesso');
      }
      await loadProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao remover produto';
      showToast(message);
    }
  };


  const exportJson = () => {
    const enriched = products.map((p) => {
      const slug = generateSlug(p.name);
      return {
        ...p,
        images: p.images
          ? p.images.map((img, i) => ({
              url: `/products/${slug}_${img.gender ? img.gender + '_' : ''}${img.type || 'product'}_${String(i + 1).padStart(2, '0')}.webp`,
              alt: img.type === 'model' && img.gender
                ? `Modelo ${img.gender} usando ${p.name}`
                : img.type === 'detail'
                  ? `Detalhe ${p.name}`
                  : p.name,
              type: img.type,
              gender: img.gender || undefined,
            }))
          : undefined,
        colorStock: (p as any)._colorStock || undefined,
      };
    });
    const output = {
      generatedAt: new Date().toISOString(),
      generatedBy: 'Bravos Brasil Admin',
      note: 'Debug export (opcional) — produtos já são persistidos no banco via API',
      fileNaming: 'slug_masculino_model_01.webp, slug_vinho_product_01.webp, slug_detail_01.webp',
      products: enriched,
    };
    return JSON.stringify(output, null, 2);
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
                { id: 'export' as TabId, icon: FileJson, label: 'Debug' },
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  onClick={loadProducts}
                  disabled={isLoadingList}
                  style={{
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#666',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: isLoadingList ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  title="Recarregar lista do banco"
                >
                  {isLoadingList ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                </button>
              </div>
              <button
                style={s.btnPrimary}
                onClick={() => {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  const baseDraft = { ...emptyDraft };
                  if (keepConfeccao && confeccaoCache) {
                    baseDraft.colorStock = confeccaoCache.colorStock.map((cs) => ({ ...cs, image: null }));
                    baseDraft.gender = confeccaoCache.gender as DraftProduct['gender'];
                  }
                  setDraft(baseDraft);
                  setEditingId(null);
                  setImages([]);
                  setActiveTab('add');
                }}
              >
                <Plus size={16} />
                NOVO PRODUTO
              </button>
            </div>

            {/* ─── Catalog Health Banner ─── */}
            {healthCounts !== null && (
              <div
                style={{
                  ...s.card,
                  padding: 16,
                  marginBottom: 16,
                  border: healthCounts.withIssues > 0 ? '1px solid #b4540080' : '1px solid #00843D60',
                  background: healthCounts.withIssues > 0 ? '#b4540010' : '#00843D10',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {healthCounts.withIssues > 0 ? (
                      <AlertTriangle size={18} style={{ color: '#b45400' }} />
                    ) : (
                      <CheckCircle2 size={18} style={{ color: '#00843D' }} />
                    )}
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: healthCounts.withIssues > 0 ? '#b45400' : '#00843D',
                    }}>
                      {healthCounts.withIssues > 0
                        ? `Atenção: ${healthCounts.withIssues} produto(s) com ajustes pendentes para ficar premium.`
                        : 'Catálogo pronto para publicar'}
                    </span>
                  </div>
                  {healthCounts.withIssues > 0 && (
                    <button
                      onClick={() => setHealthOpen(!healthOpen)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #b4540040',
                        color: '#b45400',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {healthOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {healthOpen ? 'Fechar' : 'Ver detalhes'}
                    </button>
                  )}
                </div>

                {healthOpen && healthItems.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {healthItems.slice(0, 20).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          background: '#0a0a0a',
                          borderRadius: 8,
                          border: '1px solid #222',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                            {item.id.slice(0, 8)}…
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {item.issues.map((issue) => (
                            <span
                              key={issue}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 10,
                                whiteSpace: 'nowrap',
                                background: issue === 'TEST_CATEGORY' ? '#cc444420' : '#b4540020',
                                color: issue === 'TEST_CATEGORY' ? '#cc4444' : '#b45400',
                              }}
                            >
                              {issueLabel(issue)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {healthItems.length > 20 && (
                      <div style={{ fontSize: 11, color: '#666', textAlign: 'center', paddingTop: 4 }}>
                        … e mais {healthItems.length - 20} produto(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                        {product.category.toUpperCase() === 'TESTES' && (
                          <span style={{
                            background: '#cc444420',
                            color: '#cc4444',
                            padding: '1px 8px',
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                          }}>
                            TESTE — não aparece no catálogo
                          </span>
                        )}
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

            {restoredFromDraft && (draft.name || editingId) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#FFCC2915',
                  border: '1px solid #FFCC2940',
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#FFCC29',
                }}
              >
                <span>⚡ Rascunho restaurado automaticamente</span>
                <button
                  onClick={() => {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                    const baseDraft = { ...emptyDraft };
                    if (keepConfeccao && confeccaoCache) {
                      baseDraft.colorStock = confeccaoCache.colorStock.map((cs) => ({ ...cs, image: null }));
                      baseDraft.gender = confeccaoCache.gender as DraftProduct['gender'];
                    }
                    setDraft(baseDraft);
                    setImages([]);
                    setEditingId(null);
                    setRestoredFromDraft(false);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid #FFCC2940',
                    color: '#FFCC29',
                    borderRadius: 4,
                    padding: '2px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Descartar rascunho
                </button>
              </div>
            )}

            {/* Image Upload — typed zones */}
            <div style={s.card}>
              <label style={s.label}>Fotos do Produto</label>
              <ImageUploadSection
                images={images}
                onImagesAdd={handleImagesAdd}
                onImageRemove={handleImageRemove}
                onSetMain={handleSetMain}
                gender={draft.gender}
                colorStock={draft.colorStock}
                onColorStockChange={(updated) => setDraft((p) => ({ ...p, colorStock: updated }))}
                keepConfeccao={keepConfeccao}
                setKeepConfeccao={setKeepConfeccao}
                confeccaoCache={confeccaoCache}
                setConfeccaoCache={setConfeccaoCache}
              />
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
                    rows={8}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Descrição detalhada do produto..."
                  />
                </div>

                {/* SEO Section */}
                <div style={{ gridColumn: '1 / -1', border: '1px dashed #444', borderRadius: 8, padding: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#aaa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🔍 SEO — Gerado automaticamente ao salvar
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={s.label}>
                        Meta Title <span style={{ color: '#666' }}>(máx 60 caracteres)</span>
                      </label>
                      <input
                        style={s.input}
                        type="text"
                        maxLength={60}
                        value={draft.metaTitle}
                        onChange={(e) => setDraft((p) => ({ ...p, metaTitle: e.target.value }))}
                        placeholder="Gerado automaticamente ao salvar..."
                      />
                      <span style={{ fontSize: 11, color: '#666' }}>{draft.metaTitle.length}/60</span>
                    </div>

                    <div>
                      <label style={s.label}>
                        Meta Description <span style={{ color: '#666' }}>(máx 160 caracteres)</span>
                      </label>
                      <textarea
                        style={{ ...s.textarea, resize: 'none' as const }}
                        maxLength={160}
                        rows={3}
                        value={draft.metaDescription}
                        onChange={(e) => setDraft((p) => ({ ...p, metaDescription: e.target.value }))}
                        placeholder="Gerado automaticamente ao salvar..."
                      />
                      <span style={{ fontSize: 11, color: '#666' }}>{draft.metaDescription.length}/160</span>
                    </div>

                    <div>
                      <label style={s.label}>
                        Tags SEO <span style={{ color: '#666' }}>(separadas por vírgula)</span>
                      </label>
                      <input
                        style={s.input}
                        type="text"
                        value={draft.seoTags.join(', ')}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            seoTags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                          }))
                        }
                        placeholder="Gerado automaticamente ao salvar..."
                      />
                    </div>
                  </div>
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
                  <label style={s.label}>Gênero</label>
                  <select
                    style={{ ...s.input, cursor: 'pointer' }}
                    value={draft.gender}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        gender: e.target.value as DraftProduct['gender'],
                      }))
                    }
                  >
                    <option value="unissex">Unissex</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
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

            {/* Color/Size info summary */}
            {(() => {
              const active = draft.colorStock.filter((cs) => cs.feminino.enabled || cs.masculino.enabled);
              if (active.length === 0) return null;
              const femSizes = new Set<string>();
              const mascSizes = new Set<string>();
              active.forEach((cs) => SIZES.forEach((sz) => {
                if (cs.feminino.sizes[sz]) femSizes.add(sz);
                if (cs.masculino.sizes[sz]) mascSizes.add(sz);
              }));
              return (
                <div style={{ ...s.card, padding: 16 }}>
                  <label style={s.label}>Resumo de Cores e Tamanhos</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {active.map((cs) => {
                      const def = PRODUCT_COLORS.find((c) => c.id === cs.colorId)!;
                      const badges = [cs.feminino.enabled && '♀', cs.masculino.enabled && '♂'].filter(Boolean).join('');
                      return (
                        <span key={cs.colorId} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: `${def.hex}20`, padding: '3px 10px', borderRadius: 12,
                          fontSize: 11, fontWeight: 600, color: def.hex === '#F5F5F5' ? '#333' : def.hex,
                        }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: '50%', background: def.hex,
                            border: def.hex === '#F5F5F5' ? '1px solid #999' : 'none',
                          }} />
                          {def.name} {badges}
                        </span>
                      );
                    })}
                  </div>
                  {femSizes.size > 0 && (
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                      ♀ Feminino: {Array.from(femSizes).join(', ')}
                    </div>
                  )}
                  {mascSizes.size > 0 && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      ♂ Masculino: {Array.from(mascSizes).join(', ')}
                    </div>
                  )}
                </div>
              );
            })()}

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
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  setDraft({ ...emptyDraft });
                  setImages([]);
                  setEditingId(null);
                  setActiveTab('list');
                }}
              >
                CANCELAR
              </button>
              <button
                style={{
                  ...s.btnPrimary,
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {saveProgress || 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {editingId ? 'ATUALIZAR PRODUTO' : 'SALVAR PRODUTO'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: DEBUG ─── */}
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
              FERRAMENTAS DE DEBUG
            </h2>

            <div style={{ ...s.card, padding: 16, marginBottom: 16 }}>
              <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6 }}>
                Os produtos são salvos diretamente no banco de dados via API e
                aparecem no catálogo automaticamente. As ferramentas abaixo são
                opcionais e destinadas apenas para diagnóstico.
              </p>
            </div>

            {/* Collapsible: Exportar JSON */}
            <div style={s.card}>
              <button
                onClick={() => setDebugOpen(!debugOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 0',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {debugOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Exportar JSON (opcional)
              </button>

              {debugOpen && (
                <div style={{ marginTop: 12 }}>
                  {products.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 32,
                        color: '#555',
                      }}
                    >
                      <FileJson
                        size={36}
                        style={{ margin: '0 auto 12px', opacity: 0.3 }}
                      />
                      <p>Adicione produtos antes de exportar</p>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <p style={{ color: '#888', fontSize: 13 }}>
                          {products.length} produto{products.length !== 1 ? 's' : ''} em
                          memória
                        </p>
                        <button style={s.btnPrimary} onClick={handleCopy}>
                          {copied ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                          {copied ? 'COPIADO!' : 'COPIAR JSON (DEBUG)'}
                        </button>
                      </div>

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
                    </>
                  )}
                </div>
              )}
            </div>
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
