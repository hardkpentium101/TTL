import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth0ProviderWithNavigate from './context/Auth0Provider';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CoursePage from './pages/CoursePage';
import ProtectedRoute from './components/ProtectedRoute';

// Component to sync user on auth state change
function AuthSync() {
  const { isAuthenticated, syncUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('AuthSync: User authenticated, syncing...');
      syncUser();
    }
  }, [isAuthenticated, syncUser]);

  return null;
}

// Layout component with sidebar and user info
function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overscroll-none">
      {/* Sidebar Navigation - Always visible */}
      <div className="fixed top-0 left-0 h-screen z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overscroll-none ml-20 transition-all duration-300">
        {/* Top Navigation Bar - Desktop style */}
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 flex-shrink-0 ml-20">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              AI Course Generator
            </span>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overscroll-none pt-16 pb-8">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              Text-to-Learn: AI-Powered Course Generator • Hackathon Project
            </p>
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
            {/* App Layout with Sidebar */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />

              {/* Protected Routes */}
              <Route path="my-courses" element={
                <ProtectedRoute>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">My Courses</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Your saved courses will appear here</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      💡 Tip: Use the sidebar dropdown to quickly access your recent courses
                    </p>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="bookmarks" element={
                <ProtectedRoute>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bookmarks</h1>
                    <p className="text-gray-600 dark:text-gray-400">Your bookmarked lessons will appear here</p>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="settings" element={
                <ProtectedRoute>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your account settings</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Public route - can access with or without auth */}
              <Route path="course/:courseId" element={<CoursePage />} />
            </Route>
          </Routes>
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
