import { Link, useSearchParams } from 'react-router-dom';

export function AdminNav() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'orders';

  const links = [
    { tab: 'dashboard', label: 'Dashboard' },
    { tab: 'generations', label: 'Gerações' },
    { tab: 'prompts', label: 'Prompts' },
    { tab: 'coupons', label: 'Cupons' },
    { tab: 'products', label: 'Produtos' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin?tab=dashboard';
  };

  return (
    <div className="flex gap-4 items-center flex-wrap">
      {links.map((link) => (
        <Link
          key={link.tab}
          to={`/admin?tab=${link.tab}`}
          className={`text-sm font-medium ${
            currentTab === link.tab
              ? 'text-green-600 underline'
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {link.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        Sair
      </button>
    </div>
  );
}
