import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, onAuthenticated }) {
  const { isAuthenticated, isLoading, syncUser } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]" role="status" aria-live="polite">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
