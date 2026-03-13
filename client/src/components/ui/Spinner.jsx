export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`animate-spin rounded-full border-4 border-primary/20 border-t-primary ${sizes[size]} ${className}`} />
  );
}
