import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-128px)] text-center p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-on-surface mb-2">Page not found</p>
      <p className="text-on-surface-variant mb-8">The page you are looking for does not exist.</p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
