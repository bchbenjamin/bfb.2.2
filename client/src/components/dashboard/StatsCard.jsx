export default function StatsCard({ label, value, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-container text-primary',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <div className="bg-surface-variant rounded-2xl border border-outline-variant/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-on-surface-variant">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-on-surface">{value ?? '—'}</p>
    </div>
  );
}
