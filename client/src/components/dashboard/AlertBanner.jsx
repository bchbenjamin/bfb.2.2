import { AlertTriangle, X } from 'lucide-react';

export default function AlertBanner({ alert, onDismiss }) {
  const severityStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    critical: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${severityStyles[alert.severity] || severityStyles.warning}`}>
      <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-sm">{alert.message}</p>
        <p className="text-xs opacity-75 mt-1">
          {alert.grievance_count} complaints in area &mdash; {new Date(alert.created_at).toLocaleString()}
        </p>
      </div>
      {onDismiss && (
        <button onClick={() => onDismiss(alert.id)} className="p-1 rounded-full hover:bg-black/10">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
