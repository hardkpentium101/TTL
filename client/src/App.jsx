import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth0ProviderWithNavigate from './context/Auth0Provider';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import AssessmentFlow from './pages/AssessmentFlow';
import CoursePage from './pages/CoursePage';
import ProtectedRoute from './components/ProtectedRoute';
import { refreshCoursesEvent } from './events';

// Lazy-loaded page components
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));

// Loading fallback component for Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[var(--border-light)] border-t-[var(--accent-primary)] animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  );
}

function AuthSync() {
  const { isAuthenticated, syncUser } = useAuth();

  useEffect(() => {
    const syncAndRefresh = async () => {
      if (isAuthenticated) {
        await syncUser(); // Wait for user to be synced in backend
        // Refetch courses when auth state is established (handles page refresh and token refresh)
        refreshCoursesEvent.dispatchEvent(new Event('refresh'));
      }
    };
    syncAndRefresh();
  }, [isAuthenticated, syncUser]);

  return null;
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-[72px] transition-all duration-300">
        {/* Top Bar with App Name */}
        <header className="sticky top-0 z-30 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
          <div className="flex items-center justify-end px-4 md:px-6 py-2">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[var(--text-secondary)] hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>
                Text-to-Learn
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        <footer className="border-t border-[var(--border-light)] py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Text-to-Learn: AI-Powered Course Generator
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Built for learning, one topic at a time.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <AuthSync />
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<AssessmentFlow />} />

              <Route path="bookmarks" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <BookmarksPage />
                  </ProtectedRoute>
                </Suspense>
              } />

              <Route path="settings" element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="text-center card p-12">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                        Settings
                      </h1>
                      <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                        Manage your account settings and preferences.
                      </p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="course/:courseId" element={<CoursePage />} />
            </Route>
          </Routes>
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
