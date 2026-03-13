import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Map, FileText, LayoutDashboard, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Map, roles: ['citizen', 'officer', 'admin'] },
    { to: '/file', label: t('nav.file'), icon: FileText, roles: ['citizen'] },
    { to: '/officer', label: t('nav.officer'), icon: ClipboardList, roles: ['officer', 'admin'] },
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <header className="bg-surface border-b border-outline-variant/50 sticky top-0 z-[1100]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-on-primary font-bold text-sm">BD</span>
          </div>
          <span className="font-semibold text-lg text-on-surface hidden sm:inline">
            {t('app.name')}
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {visibleNavItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-primary-container text-primary'
                  : 'text-on-surface-variant hover:bg-on-surface/5'
              }`}
            >
              <item.icon size={18} />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-on-surface-variant hover:bg-on-surface/5 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
