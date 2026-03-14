export default function Button({ children, variant = 'filled', size = 'md', className = '', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    filled: 'bg-primary text-on-primary hover:opacity-90 shadow-md hover:shadow-lg active:shadow-sm',
    outlined: 'border-2 border-primary text-primary hover:bg-primary/5',
    text: 'text-primary hover:bg-primary/10',
    danger: 'bg-error text-on-error hover:opacity-90 shadow-md hover:shadow-lg active:shadow-sm',
    ghost: 'text-on-surface-variant hover:bg-on-surface/10',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
    icon: 'p-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.filled} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
