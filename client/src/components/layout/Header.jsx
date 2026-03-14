import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Map, FileText, LayoutDashboard, ClipboardList, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTTS } from '../../hooks/useTTS.js';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { stop, enabled, toggle } = useTTS();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Map, roles: ['citizen', 'officer', 'admin'] },
    { to: '/file', label: t('nav.file'), icon: FileText, roles: ['citizen'] },
    { to: '/officer', label: t('nav.officer'), icon: ClipboardList, roles: ['officer', 'admin'] },
    { to: '/admin/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['officer', 'admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

  function handleToggleTTS() {
    const lang = i18n.language;
    if (enabled) {
      stop();
      toggle(lang);
    } else {
      if (['tcy', 'kok'].includes(lang)) {
        const toast = document.createElement('div');
        toast.textContent = t('tts.unsupported');
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:12px;z-index:9999;font-size:13px;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
      toggle(lang);
    }
  }

  return (
    <header className="bg-surface border-b border-outline-variant/50 sticky top-0 z-[1100]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="BengaluruDuru Logo" className="h-8 w-auto object-contain" />
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
          {/* Hover-to-Read toggle */}
          <button
            onClick={handleToggleTTS}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
              enabled
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-on-surface/5'
            }`}
            title={enabled ? t('tts.stop') : t('tts.speak')}
          >
            {enabled ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span className="hidden lg:inline">{enabled ? t('tts.stop') : t('tts.speak')}</span>
          </button>

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
