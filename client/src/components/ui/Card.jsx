export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`bg-surface-variant rounded-2xl border border-outline-variant/30 shadow-md ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
