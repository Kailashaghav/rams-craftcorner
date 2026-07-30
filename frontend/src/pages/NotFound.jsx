import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-4">NotFound</h1>
        <Link to="/" className="btn-primary">← Back to Home</Link>
      </div>
    </div>
  );
}
