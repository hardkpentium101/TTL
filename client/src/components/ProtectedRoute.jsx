import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children, onAuthenticated }) {
  const { isAuthenticated, isLoading, login, syncUser } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Sync user with backend when authenticated
      syncUser().then((user) => {
        if (onAuthenticated) {
          onAuthenticated(user);
        }
      });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Auto-redirect to login
    login();
    return null;
  }

  return children;
}
