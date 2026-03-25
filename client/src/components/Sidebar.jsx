import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserCourses } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { refreshCoursesEvent } from '../events';

const NAV_ITEMS = [
  { 
    path: '/', 
    label: 'Home', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  { 
    path: '/my-courses', 
    label: 'My Courses', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  { 
    path: '/bookmarks', 
    label: 'Bookmarks', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [myCoursesOpen, setMyCoursesOpen] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  const isExpanded = !isCollapsed || isHovered;

  useEffect(() => {
    const fetchCourses = async () => {
      if (isAuthenticated) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const token = localStorage.getItem('auth0_token');
        if (!token) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      try {
        const data = await getUserCourses();
        setUserCourses(data.courses || []);
      } catch (err) {
        console.error('Sidebar: Failed to fetch courses:', err);
        setUserCourses([]);
      }
    };
    fetchCourses();
  }, [isAuthenticated, refreshTrigger]);

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    refreshCoursesEvent.addEventListener('refresh', handleRefresh);
    return () => refreshCoursesEvent.removeEventListener('refresh', handleRefresh);
  }, []);

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

  const isActive = (path) => location.pathname === path;

  const handleCourseClick = async (course, e) => {
    e.stopPropagation();
    const courseId = course.id || course._id;

    if (courseId) {
      if (course.modules && course.modules.length > 0) {
        navigate(`/course/${courseId}`, { state: { course } });
      } else {
        try {
          const { getCourseById } = await import('../utils/api');
          const data = await getCourseById(courseId);
          navigate(`/course/${courseId}`, { state: { course: data.course } });
        } catch {
          navigate(`/course/${courseId}`);
        }
      }
    } else {
      navigate(`/course/${encodeURIComponent(course.title)}`);
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-md hover:shadow-lg transition-all duration-300"
        aria-label="Toggle menu"
      >
        <svg 
          className={`w-5 h-5 text-[var(--text-primary)] transition-transform duration-300 ${!isCollapsed ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
        </svg>
      </button>

      {/* Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 flex flex-col h-screen bg-[var(--bg-card)] border-r border-[var(--border-light)] transition-all duration-300 ease-out z-50 ${
          isExpanded ? 'w-[280px]' : 'w-[72px]'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--border-light)] flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white text-lg font-bold">T</span>
            </div>
            <span 
              className={`font-bold text-lg whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Text-to-Learn
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <div key={item.path}>
              <Link
                to={item.path}
                onClick={(e) => {
                  if (item.path === '/my-courses') {
                    e.preventDefault();
                    setMyCoursesOpen(!myCoursesOpen);
                  }
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path) && item.path !== '/my-courses'
                    ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-dark)] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                <span 
                  className={`font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
                  }`}
                >
                  {item.label}
                </span>
                {item.path === '/my-courses' && isExpanded && (
                  <svg 
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${myCoursesOpen ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {/* Submenu */}
              {item.path === '/my-courses' && myCoursesOpen && isExpanded && (
                <div className="ml-3 mt-2 space-y-1 animate-fade-in">
                  {userCourses.length > 0 ? (
                    userCourses.slice(0, 5).map((course) => (
                      <button
                        key={course.id}
                        onClick={(e) => handleCourseClick(course, e)}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <div className="font-medium truncate">{course.title}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {course.modules_count} modules
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm text-[var(--text-muted)] mb-2">No courses yet</p>
                      <Link 
                        to="/" 
                        className="text-xs text-[var(--accent-primary)] hover:underline"
                        onClick={() => setIsCollapsed(true)}
                      >
                        Generate your first course
                      </Link>
                    </div>
                  )}
                  {userCourses.length > 5 && (
                    <Link 
                      to="/my-courses"
                      className="block px-3 py-2 text-xs text-[var(--accent-primary)] hover:underline"
                      onClick={() => setIsCollapsed(true)}
                    >
                      View all {userCourses.length} courses →
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-[var(--border-light)] flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
              {isExpanded && (
                <div className="flex-1">
                  <div className="h-4 skeleton rounded w-24 mb-2" />
                  <div className="h-3 skeleton rounded w-16" />
                </div>
              )}
            </div>
          ) : isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <img
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=c4703c&color=fff&size=80`}
                  alt={user.name || 'User'}
                  className="w-10 h-10 rounded-full flex-shrink-0 object-cover ring-2 ring-[var(--bg-tertiary)]"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=c4703c&color=fff&size=80`;
                  }}
                />
                <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'}`}>
                  <p className="font-medium text-sm text-[var(--text-primary)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
              </div>
              {isExpanded && (
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {isExpanded ? (
                <>
                  <div className="px-3 py-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">Guest Mode</span>
                  </div>
                  <button
                    onClick={() => login()}
                    className="w-full btn btn-primary text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Sign In
                  </button>
                </>
              ) : (
                <button
                  onClick={() => login()}
                  className="w-full p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                  title="Sign In"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
