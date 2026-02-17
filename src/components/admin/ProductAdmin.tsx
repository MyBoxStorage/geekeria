import { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Copy,
  Check,
  ChevronLeft,
  LogOut,
  Package,
  List,
  FileJson,
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
}: {
  images: DraftImage[];
  onImagesAdd: (imgs: DraftImage[]) => void;
  onImageRemove: (id: string) => void;
  onSetMain: (id: string) => void;
  gender: 'masculino' | 'feminino' | 'unissex';
  colorStock: ColorStock[];
  onColorStockChange: (updated: ColorStock[]) => void;
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

export default function ProductAdmin({ onLogout }: ProductAdminProps) {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<DraftProduct>({ ...emptyDraft });
  const [images, setImages] = useState<DraftImage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleSave = () => {
    if (!draft.name || !draft.price || !draft.category) {
      showToast('Preencha nome, preço e categoria');
      return;
    }

    const slug = generateSlug(draft.name);

    const typedImages: NonNullable<Product['images']> = images.map((img, i) => ({
      url: `/products/${slug}_${img.gender ? img.gender + '_' : ''}${img.type}_${String(i + 1).padStart(2, '0')}.webp`,
      alt: img.type === 'model' && img.gender
        ? `Modelo ${img.gender} usando ${draft.name}`
        : img.type === 'detail'
          ? `Detalhe ${draft.name}`
          : draft.name,
      type: img.type,
      gender: img.gender,
    }));

    const mainImg = images.find((i) => i.isMain);
    const mainIdx = mainImg ? images.indexOf(mainImg) : 0;
    const imagePath =
      typedImages.length > 0
        ? typedImages[mainIdx]?.url ?? typedImages[0].url
        : draft.image || '/products/placeholder.webp';

    const activeColors = draft.colorStock.filter((cs) => cs.feminino.enabled || cs.masculino.enabled);
    const derivedColors = activeColors.map((cs) => cs.colorId);
    const derivedSizes = Array.from(
      new Set(activeColors.flatMap((cs) => [
        ...SIZES.filter((sz) => cs.feminino.sizes[sz]),
        ...SIZES.filter((sz) => cs.masculino.sizes[sz]),
      ]))
    );

    const colorImages: NonNullable<Product['images']> = activeColors
      .filter((cs) => cs.image)
      .map((cs) => ({
        url: `/products/${slug}_${cs.colorId}_01.webp`,
        alt: draft.name,
        type: 'product' as const,
        gender: undefined,
      }));

    const allImages = [...typedImages, ...colorImages];

    const product: Product = {
      id: editingId || generateId(),
      name: draft.name,
      description: draft.description,
      price: parseFloat(draft.price) || 0,
      originalPrice: draft.originalPrice
        ? parseFloat(draft.originalPrice)
        : undefined,
      image: imagePath,
      images: allImages.length > 0 ? allImages : undefined,
      category: draft.category,
      gender: draft.gender,
      sizes: derivedSizes.length > 0 ? derivedSizes : draft.sizes,
      colors: derivedColors.length > 0 ? derivedColors : draft.colors,
      rating: parseFloat(draft.rating) || 4.8,
      reviews: parseInt(draft.reviews, 10) || 0,
      badge: draft.badge || undefined,
      isNew: draft.isNew || undefined,
      isBestseller: draft.isBestseller || undefined,
    };

    (product as any)._colorStock = activeColors.map((cs) => {
      const def = PRODUCT_COLORS.find((c) => c.id === cs.colorId)!;
      return {
        id: cs.colorId,
        name: def.name,
        hex: def.hex,
        image: cs.image ? `/products/${slug}_${cs.colorId}_01.webp` : null,
        stock: {
          feminino: {
            available: cs.feminino.enabled,
            sizes: SIZES.filter((sz) => cs.feminino.sizes[sz]),
          },
          masculino: {
            available: cs.masculino.enabled,
            sizes: SIZES.filter((sz) => cs.masculino.sizes[sz]),
          },
        },
      };
    });

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
    const savedStock = (product as any)._colorStock as any[] | undefined;
    const restoredStock = PRODUCT_COLORS.map((c) => {
      const base = emptyColorStock(c.id);
      if (savedStock) {
        const saved = savedStock.find((s: any) => s.id === c.id);
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
          return { ...base, feminino: fem, masculino: masc };
        }
      }
      if (!product.colors.includes(c.id)) return base;
      const fem = { ...base.feminino, enabled: true };
      const masc = { ...base.masculino, enabled: true };
      product.sizes.forEach((sz) => {
        if (sz in fem.sizes) { fem.sizes[sz as SizeName] = true; masc.sizes[sz as SizeName] = true; }
      });
      return { ...base, feminino: fem, masculino: masc };
    });
    setDraft({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      image: product.image,
      category: product.category,
      gender: product.gender || 'unissex',
      sizes: product.sizes,
      colors: product.colors,
      colorStock: restoredStock,
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
    const json = JSON.stringify(enriched, null, 2);
    return `// Generated by Bravos Brasil Admin - ${new Date().toLocaleDateString('pt-BR')}\n// Paste into src/data/products.ts\n// File naming: slug_masculino_model_01.webp, slug_vinho_product_01.webp, slug_detail_01.webp\n\nimport type { Product } from '@/types';\n\nexport const allProducts: Product[] = ${json};\n`;
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
