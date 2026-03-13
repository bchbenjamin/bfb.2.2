import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../../utils/constants.js';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-on-surface/5 text-on-surface transition-colors text-sm font-medium"
      >
        <Globe size={18} />
        <span className="hidden sm:inline">{current.nativeLabel}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-2xl shadow-lg border border-outline-variant/50 overflow-hidden z-50">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/5 transition-colors flex items-center justify-between ${
                i18n.language === lang.code ? 'bg-primary-container text-primary font-medium' : 'text-on-surface'
              }`}
            >
              <span>{lang.nativeLabel}</span>
              <span className="text-on-surface-variant text-xs">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
