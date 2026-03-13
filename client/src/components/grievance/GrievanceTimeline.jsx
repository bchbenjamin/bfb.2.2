import { useTranslation } from 'react-i18next';
import { Check, Circle } from 'lucide-react';
import { STATUS_ORDER } from '../../utils/constants.js';
import { getStatusColor } from '../../utils/statusColors.js';

export default function GrievanceTimeline({ currentStatus }) {
  const { t } = useTranslation();
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex flex-col gap-0">
      {STATUS_ORDER.filter(s => s !== 'reopened').map((status, i) => {
        const isActive = status === currentStatus;
        const isPast = i <= currentIndex && currentStatus !== 'reopened';
        const colors = getStatusColor(status);

        return (
          <div key={status} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isPast ? 'bg-primary text-on-primary' : isActive ? `${colors.bg}` : 'bg-surface-container'
              }`}>
                {isPast ? <Check size={14} /> : <Circle size={14} className="text-outline" />}
              </div>
              {i < STATUS_ORDER.length - 2 && (
                <div className={`w-0.5 h-6 ${isPast ? 'bg-primary' : 'bg-outline-variant'}`} />
              )}
            </div>
            <span className={`text-sm ${isActive ? 'font-semibold text-on-surface' : isPast ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              {t(`status.${status}`)}
            </span>
          </div>
        );
      })}
      {currentStatus === 'reopened' && (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
            <Circle size={14} className="text-red-600" />
          </div>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">{t('status.reopened')}</span>
        </div>
      )}
    </div>
  );
}
