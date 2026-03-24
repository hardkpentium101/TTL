import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CoursePage from './pages/CoursePage';

// Layout component with sidebar (Milestone 7: React Router and Sidebar Layout)
function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="lg:ml-64 transition-all duration-300">
        {/* Top Navigation Bar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-6">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Text-to-Learn AI Course Generator
            </span>
          </div>
        </nav>
        
        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
    <BrowserRouter>
      <Routes>
        {/* App Layout with Sidebar */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="my-courses" element={
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">My Courses</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Your saved courses will appear here</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                💡 Tip: Use the sidebar dropdown to quickly access your recent courses
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
                (Milestone 5: Database integration pending)
              </p>
            </div>
          } />
          <Route path="bookmarks" element={
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bookmarks</h1>
              <p className="text-gray-600 dark:text-gray-400">Your bookmarked lessons will appear here</p>
            </div>
          } />
          <Route path="settings" element={
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">Application settings (Milestone 4: Auth0 integration)</p>
            </div>
          } />
          <Route path="course/:courseTitle" element={<CoursePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
