import { useState, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLogin } from './AdminLogin';
import { useSEO } from '@/hooks/useSEO';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminDashboardPage = lazy(() =>
  import('./AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminGenerationsPage = lazy(() =>
  import('./AdminGenerationsPage').then((m) => ({ default: m.AdminGenerationsPage }))
);
const AdminPromptsPage = lazy(() =>
  import('./AdminPromptsPage').then((m) => ({ default: m.AdminPromptsPage }))
);
const AdminCouponsPage = lazy(() =>
  import('./AdminCouponsPage').then((m) => ({ default: m.AdminCouponsPage }))
);
const ProductAdmin = lazy(() => import('@/components/admin/ProductAdmin'));

type TabId = 'orders' | 'dashboard' | 'generations' | 'prompts' | 'coupons' | 'products';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'orders', label: 'Pedidos', icon: '📦' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'generations', label: 'Estampas', icon: '🎨' },
  { id: 'prompts', label: 'Prompts', icon: '🤖' },
  { id: 'coupons', label: 'Cupons', icon: '🎟️' },
  { id: 'products', label: 'Produtos', icon: '👕' },
];

const PATH_TO_TAB: Record<string, TabId> = {
  dashboard: 'dashboard',
  generations: 'generations',
  prompts: 'prompts',
  coupons: 'coupons',
  products: 'products',
};

function isValidTab(t: string | null): t is TabId {
  return t !== null && TABS.some((tab) => tab.id === t);
}

function resolveInitialTab(paramTab: string | null, pathname: string): TabId {
  if (isValidTab(paramTab)) return paramTab;
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  if (segment && segment in PATH_TO_TAB) return PATH_TO_TAB[segment];
  return 'orders';
}

export function AdminUnifiedPage() {
  useSEO({ title: 'Admin | GEEKERIA', description: '', noindex: true });

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab = useMemo(
    () => resolveInitialTab(searchParams.get('tab'), location.pathname),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, error, login, logout } = useAdminAuth();

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    navigate(`/admin?tab=${tab}`, { replace: true });
  };

  // Gate: require admin auth for ALL tabs (consistent UX on expired/missing token)
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLogin={login}
        error={error}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0f0f0f',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: sidebarOpen ? 220 : 64,
          background: '#0a0a0a',
          borderRight: '1px solid #1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
          }}
        >
          {sidebarOpen && (
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 18,
                letterSpacing: 2,
                color: '#fff',
              }}
            >
              GEEKERIA
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4,
            }}
          >
            {sidebarOpen ? '\u25C0' : '\u25B6'}
          </button>
        </div>

        {/* Tabs */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 4,
                background:
                  activeTab === tab.id ? '#7C3AED20' : 'transparent',
                color: activeTab === tab.id ? '#7C3AED' : '#666',
                borderLeft: `3px solid ${activeTab === tab.id ? '#7C3AED' : 'transparent'}`,
                transition: 'all 0.15s',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
              title={!sidebarOpen ? tab.label : undefined}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{tab.icon}</span>
              {sidebarOpen && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {tab.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #1e1e1e',
              fontSize: 11,
              color: '#333',
              textAlign: 'center',
            }}
          >
            Admin Panel &bull; 2026
          </div>
        )}
      </aside>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Suspense
          fallback={
            <div style={{ padding: 24, color: '#666', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              Carregando…
            </div>
          }
        >
          {activeTab === 'orders' && <AdminDashboard />}
          {activeTab === 'dashboard' && <AdminDashboardPage />}
          {activeTab === 'generations' && <AdminGenerationsPage />}
          {activeTab === 'prompts' && <AdminPromptsPage />}
          {activeTab === 'coupons' && <AdminCouponsPage />}
          {activeTab === 'products' && (
            <ProductAdmin
              onLogout={() => {
                logout();
                switchTab('orders');
              }}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}
