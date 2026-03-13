import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-surface rounded-3xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-outline-variant/30 ${className}`}>
        <div className="flex items-center justify-between p-6 pb-4">
          {title && <h2 className="text-xl font-semibold text-on-surface">{title}</h2>}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-on-surface/5 text-on-surface-variant transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
