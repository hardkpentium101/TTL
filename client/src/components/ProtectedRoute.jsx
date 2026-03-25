import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * Allows both authenticated and anonymous users
 * Syncs user with backend when authenticated
 */
export default function ProtectedRoute({ children, onAuthenticated }) {
  const { isAuthenticated, isLoading, syncUser } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Sync user with backend when authenticated
      syncUser().then((user) => {
        if (onAuthenticated) {
          onAuthenticated(user);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Allow anonymous users to access the app
  return children;
}
