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
  const [isHoveringAppArea, setIsHoveringAppArea] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [myCoursesOpen, setMyCoursesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!isAuthenticated) {
        setUserCourses([]);
        return;
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
        setIsHoveringAppArea(false);
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setIsHoveringAppArea(false);
  };

  // Expander visibility:
  // - Collapsed + not hovering: hidden
  // - Collapsed + hovering app area: visible (emerges on right)
  // - Expanded: always visible (on right)
  const showExpander = !isCollapsed || isHoveringAppArea;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 flex flex-col h-screen bg-[var(--bg-card)] border-r border-[var(--border-light)] transition-all duration-300 ease-out z-50 ${
          isCollapsed ? 'w-[72px]' : 'w-[280px]'
        }`}
      >
        {/* Top Section - App Icon (left) | Expander (overlaps app icon on hover, right when expanded) */}
        <div
          data-sidebar-top="true"
          className="h-16 flex items-center px-3 flex-shrink-0 relative"
          onMouseEnter={() => {
            if (isCollapsed) setIsHoveringAppArea(true);
          }}
          onMouseLeave={() => {
            setIsHoveringAppArea(false);
          }}
        >
          {/* App Icon - LEFT side */}
          <div
            data-app-icon="true"
            className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 ${
              isHoveringAppArea ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
            }`}
            onClick={toggleSidebar}
          >
            <span className="text-white text-lg font-bold">T</span>
          </div>

          {/* Sidebar Expander - slides over app icon on hover, moves to right when expanded */}
          {showExpander && (
            <button
              onClick={toggleSidebar}
              className={`w-10 h-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] transition-all duration-300 flex items-center justify-center group flex-shrink-0 ${
                isCollapsed
                  ? 'absolute left-3 opacity-100'  // Overlapping app icon position
                  : 'ml-auto opacity-100'          // Right side when expanded
              }`}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item, index) => (
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
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                  isActive(item.path) && item.path !== '/my-courses'
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}>
                  {item.icon}
                </span>
                <span
                  className={`font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]'
                  }`}
                >
                  {item.label}
                </span>
                {item.path === '/my-courses' && !isCollapsed && (
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
              {item.path === '/my-courses' && myCoursesOpen && !isCollapsed && (
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
                      >
                        Generate your first course
                      </Link>
                    </div>
                  )}
                  {userCourses.length > 5 && (
                    <Link
                      to="/my-courses"
                      className="block px-3 py-2 text-xs text-[var(--accent-primary)] hover:underline"
                    >
                      View all {userCourses.length} courses →
                    </Link>
                  )}
                </div>
              )}

              {/* Section Separator */}
              {index < NAV_ITEMS.length - 1 && (
                <div data-separator="true" className="my-2" />
              )}
            </div>
          ))}
        </nav>

        {/* User Section - no border-t, moved left by 10px */}
        <div
          data-user-section="true"
          className="px-2 py-3 flex-shrink-0 overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center gap-3 px-3 py-2 min-h-[48px]">
              <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="h-4 skeleton rounded w-24 mb-2" />
                  <div className="h-3 skeleton rounded w-16" />
                </div>
              )}
            </div>
          ) : isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 min-h-[48px]">
                <img
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=c4703c&color=fff&size=80`}
                  alt={user.name || 'User'}
                  className="w-10 h-10 rounded-full flex-shrink-0 object-cover ring-2 ring-[var(--bg-tertiary)]"
                  style={{ minWidth: '40px', maxWidth: '40px' }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=c4703c&color=fff&size=80`;
                  }}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                )}
              </div>
              {isCollapsed ? (
                <button
                  onClick={() => logout()}
                  className="w-full p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
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
              <div className="flex items-center gap-3 px-3 py-2 min-h-[48px]">
                <div
                  data-guest-icon="true"
                  className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0"
                  style={{ minWidth: '40px', maxWidth: '40px' }}
                >
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)]">Guest</p>
                  </div>
                )}
              </div>
              {isCollapsed ? (
                <button
                  onClick={() => login()}
                  className="w-full p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => login()}
                  className="w-full btn btn-primary text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
