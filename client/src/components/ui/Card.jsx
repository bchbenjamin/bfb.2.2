export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`bg-surface-variant rounded-2xl border border-outline-variant/50 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30 transition-all' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
