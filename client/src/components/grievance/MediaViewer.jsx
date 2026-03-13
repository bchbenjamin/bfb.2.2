import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Image } from 'lucide-react';

export default function MediaViewer({ url, verified, className = '' }) {
  const { t } = useTranslation();

  if (!url) return null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-outline-variant/50 ${className}`}>
      <img
        src={url}
        alt="Grievance media"
        className="w-full max-h-80 object-cover"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div className="hidden items-center justify-center h-40 bg-surface-container text-on-surface-variant">
        <Image size={48} className="opacity-30" />
      </div>
      <div className="px-3 py-2 bg-surface-container flex items-center gap-2 text-sm">
        {verified ? (
          <>
            <CheckCircle size={16} className="text-success" />
            <span className="text-success">{t('grievance.media_verified')}</span>
          </>
        ) : (
          <>
            <XCircle size={16} className="text-warning" />
            <span className="text-warning">{t('grievance.media_unverified')}</span>
          </>
        )}
      </div>
    </div>
  );
}
