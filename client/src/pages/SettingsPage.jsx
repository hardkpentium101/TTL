import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:py-12">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
        Settings
      </h1>

      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          {isAuthenticated && user ? (
            <>
              <img
                src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=ff4d00&color=fff&size=80`}
                alt={user.name || 'User'}
                className="w-16 h-16 object-cover border-2 border-[var(--border-light)]"
              />
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{user.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[var(--bg-tertiary)] border-2 border-[var(--border-light)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Guest User</h2>
                <p className="text-sm text-[var(--text-muted)]">Sign in to access your settings</p>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[var(--border-light)] pt-6">
          <p className="text-[var(--text-secondary)]">
            More settings options coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
