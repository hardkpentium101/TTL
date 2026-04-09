import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth0ProviderWithNavigate from './context/Auth0Provider';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CoursePage from './pages/CoursePage';
import ProtectedRoute from './components/ProtectedRoute';
import BookmarksPage from './pages/BookmarksPage';
import MyCoursesPage from './pages/MyCoursesPage';
import SettingsPage from './pages/SettingsPage';
import { SidebarProvider, SidebarMobileToggle } from './context/SidebarContext';

function AuthSync() {
  const { isAuthenticated, syncUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      syncUser();
    }
  }, [isAuthenticated, syncUser]);

  return null;
}

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        {/* Skip to content link (accessibility) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Sidebar — desktop: sticky, mobile: drawer */}
        <Sidebar />

        <main className="flex-1 flex flex-col min-h-screen transition-all duration-300">
          {/* Top Bar */}
          <header className="sticky top-0 z-[var(--z-sticky)] bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-light)]" role="banner">
            <div className="flex items-center justify-between px-4 md:px-6 py-2">
              <SidebarMobileToggle />
              <div className="flex items-center gap-2 ml-auto">
                <h1 className="text-sm font-semibold text-[var(--text-secondary)] hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>
                  Text-to-Learn
                </h1>
              </div>
            </div>
          </header>

          <div id="main-content" className="flex-1 overflow-y-auto" role="main">
            <Outlet />
          </div>

          <footer className="border-t border-[var(--border-light)] py-6 mt-auto" role="contentinfo">
            <div className="max-w-5xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--accent-primary)] flex items-center justify-center">
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
    </SidebarProvider>
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
              <Route index element={<Home />} />
              
              <Route path="my-courses" element={
                <ProtectedRoute>
                  <MyCoursesPage />
                </ProtectedRoute>
              } />

              <Route path="bookmarks" element={
                <ProtectedRoute>
                  <BookmarksPage />
                </ProtectedRoute>
              } />

              <Route path="settings" element={
                <ProtectedRoute>
                  <SettingsPage />
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
