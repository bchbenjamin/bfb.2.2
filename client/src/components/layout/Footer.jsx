import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface border-t border-outline-variant/50 py-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-on-surface-variant">
        <p>{t('app.name')} &mdash; {t('app.tagline')}</p>
      </div>
    </footer>
  );
}
