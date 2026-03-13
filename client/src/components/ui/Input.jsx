export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-on-surface-variant">{label}</label>}
      <input
        className="w-full px-4 py-3 rounded-xl bg-surface-variant text-on-surface border border-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
        {...props}
      />
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
}
