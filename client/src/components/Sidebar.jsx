import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserCourses } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { refreshCoursesEvent } from '../events';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [myCoursesOpen, setMyCoursesOpen] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  // Sidebar expands on hover (desktop) or toggle (mobile)
  const isExpanded = !isCollapsed || isHovered;

  // Fetch user's courses when authenticated or refresh triggered
  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Sidebar: Fetching courses, isAuthenticated:', isAuthenticated);

      // Always try to fetch courses (works for both authenticated and anonymous users)
      // Wait a bit for token to be stored by Auth0/useAuth if logged in
      if (isAuthenticated) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if token exists
        const token = localStorage.getItem('auth0_token');
        if (!token) {
          console.log('Sidebar: No token yet, waiting...');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      try {
        console.log('Sidebar: Calling getUserCourses API...');
        const data = await getUserCourses();
        console.log('Sidebar: Got courses:', data);
        setUserCourses(data.courses || []);
      } catch (err) {
        console.error('Sidebar: Failed to fetch courses:', err);
        setUserCourses([]);
      }
    };
    fetchCourses();
  }, [isAuthenticated, refreshTrigger]);

  // Listen for course refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Sidebar: Received refresh event');
      setRefreshTrigger(prev => prev + 1);
    };

    refreshCoursesEvent.addEventListener('refresh', handleRefresh);
    return () => refreshCoursesEvent.removeEventListener('refresh', handleRefresh);
  }, []);

  // Handle responsive behavior - collapsed by default, expand on hover (desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main navigation items
  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      hasSubmenu: false
    },
    { 
      path: '/my-courses', 
      label: 'My Courses', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      hasSubmenu: true,
      submenu: []  // Will be populated from userCourses
    },
    { 
      path: '/bookmarks', 
      label: 'Bookmarks', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      hasSubmenu: false
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      hasSubmenu: false
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleCourseClick = async (course, e) => {
    e.stopPropagation();
    const courseId = course.id || course._id;

    if (courseId) {
      // If course has full data (modules), navigate with state
      if (course.modules && course.modules.length > 0) {
        navigate(`/course/${courseId}`, { state: { course } });
      } else {
        // Fetch full course data first
        try {
          const { getCourseById } = await import('../utils/api');
          const data = await getCourseById(courseId);
          navigate(`/course/${courseId}`, { state: { course: data.course } });
        } catch (err) {
          console.error('Failed to fetch course details:', err);
          // Navigate anyway, CoursePage will fetch from API
          navigate(`/course/${courseId}`);
        }
      }
    } else {
      navigate(`/course/${encodeURIComponent(course.title)}`);
    }
  };

  const handleNavClick = (item, e) => {
    if (item.hasSubmenu) {
      e.preventDefault();
      setMyCoursesOpen(!myCoursesOpen);
    }
  };

  return (
    <>
      {/* Toggle button - Show on both mobile and desktop */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay when sidebar is open - click to close */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar - Collapsed w-20 (80px), Expanded w-64 (256px) */}
      <aside
        className={`fixed top-0 left-0 flex flex-col h-screen bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transition-all duration-300 z-50 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-3xl w-8 h-8 flex-shrink-0 flex items-center justify-center">📚</span>
            <span className={`font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300 overflow-hidden ${
              isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
            }`}>
              Text-to-Learn
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.path}>
              {/* Main Nav Item */}
              <Link
                to={item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group overflow-hidden ${
                  isActive(item.path) && !item.hasSubmenu
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                } ${item.hasSubmenu ? 'cursor-pointer' : ''}`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                <span className={`font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
                }`}>
                  {item.label}
                </span>
              </Link>

              {/* Submenu for My Courses */}
              {item.hasSubmenu && myCoursesOpen && isExpanded && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-600 pl-4">
                  {userCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={(e) => handleCourseClick(course, e)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-white rounded transition-colors"
                    >
                      <div className="font-medium truncate">{course.title}</div>
                      <div className="text-xs text-gray-500">
                        {course.modules_count || course.modules} modules • {course.lessons_count || course.lessons} lessons
                      </div>
                    </button>
                  ))}
                  {userCourses.length === 0 && (
                    <p className="text-sm text-gray-500 px-3 py-2">
                      No courses yet. Generate your first course!
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse flex-shrink-0"></div>
              {isExpanded && (
                <div className="flex-1">
                  <div className="h-3 bg-gray-600 rounded w-20 mb-1 animate-pulse"></div>
                  <div className="h-2 bg-gray-600 rounded w-12 animate-pulse"></div>
                </div>
              )}
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=40`}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full flex-shrink-0 object-cover bg-gray-200"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff&size=40`;
                }}
              />
              {isExpanded && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              )}
              {isExpanded && (
                <button
                  onClick={() => logout()}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-auto"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isExpanded && (
                <span className="text-sm text-gray-600 dark:text-gray-400">👤 Guest Mode</span>
              )}
              {!isExpanded && (
                <span className="text-xl">👤</span>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
