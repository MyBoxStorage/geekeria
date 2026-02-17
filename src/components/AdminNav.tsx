import { Link, useLocation } from 'react-router-dom';

export function AdminNav() {
  const location = useLocation();

  const links = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/generations', label: 'Gerações' },
    { path: '/admin/prompts', label: 'Prompts' },
    { path: '/admin/coupons', label: 'Cupons' },
    { path: '/admin/products', label: 'Produtos' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/dashboard';
  };

  return (
    <div className="flex gap-4 items-center flex-wrap">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`text-sm font-medium ${
            location.pathname === link.path
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
