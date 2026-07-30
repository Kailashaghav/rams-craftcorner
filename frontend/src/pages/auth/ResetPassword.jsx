import { Link } from 'react-router-dom';
export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-card text-center max-w-md w-full mx-4">
        <div className="text-5xl mb-4">🎁</div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-4">ResetPassword</h1>
        <Link to="/login" className="btn-primary">← Back to Login</Link>
      </div>
    </div>
  );
}
