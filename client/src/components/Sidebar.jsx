import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Mock courses data (will be replaced with API call in Milestone 5: Database)
const mockUserCourses = [
  { id: 1, title: 'Introduction to Machine Learning', modules: 3, lessons: 12 },
  { id: 2, title: 'React Hooks Deep Dive', modules: 2, lessons: 8 },
  { id: 3, title: 'Python for Beginners', modules: 4, lessons: 15 },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [myCoursesOpen, setMyCoursesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(true);
      }
    };
    
    // Set initial state
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
      submenu: mockUserCourses
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

  // Determine if sidebar should be expanded (either not collapsed or being hovered)
  const isExpanded = !isCollapsed || isHovered;

  const handleNavClick = (item, e) => {
    if (item.hasSubmenu && !isExpanded) {
      e.preventDefault();
      setMyCoursesOpen(!myCoursesOpen);
    } else if (item.hasSubmenu && isExpanded) {
      e.preventDefault();
      setMyCoursesOpen(!myCoursesOpen);
    }
  };

  const handleCourseClick = (course, e) => {
    e.stopPropagation();
    navigate(`/course/${encodeURIComponent(course.title)}`);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      )}

      {/* Fixed Logo Header - Always visible */}
      <div className="fixed top-0 left-0 h-16 w-64 z-[60] flex items-center px-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="text-3xl w-8 h-8 ml-2 flex-shrink-0 flex items-center justify-center">📚</span>
          <span className="font-bold text-xl ml-5 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
            Text-to-Learn
          </span>
        </Link>
      </div>

      {/* Sidebar */}
      <div className="relative">
        <aside
          className={`fixed top-0 left-0 h-full bg-black/30 backdrop-blur-xl dark:bg-black/30 transition-all duration-100 z-50 ${
            isExpanded ? 'w-64' : 'w-20'
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        {/* Logo Section - Hidden, logo is in fixed header above */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700"></div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <div key={item.path}>
              {/* Main Nav Item */}
              <Link
                to={item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive(item.path) && !item.hasSubmenu
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${item.hasSubmenu ? 'cursor-pointer' : ''}`}
                title={!isExpanded ? item.label : undefined}
              >
                <span className={isActive(item.path) ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}>
                  {item.icon}
                </span>
                {isExpanded && (
                  <>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.hasSubmenu && (
                      <svg
                        className={`w-4 h-4 transition-transform ${myCoursesOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </>
                )}
              </Link>

              {/* Submenu for My Courses */}
              {item.hasSubmenu && isExpanded && myCoursesOpen && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  {item.submenu.map((course) => (
                    <button
                      key={course.id}
                      onClick={(e) => handleCourseClick(course, e)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
                    >
                      <div className="font-medium truncate">{course.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {course.modules} modules • {course.lessons} lessons
                      </div>
                    </button>
                  ))}
                  {item.submenu.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                      No courses yet. Generate your first course!
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Section (placeholder for Auth0 integration - Milestone 4) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              U
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">user@example.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      </div>
    </>
  );
}
