import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserCourses } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { refreshCoursesEvent } from '../events';
import { useSidebar } from '../context/SidebarContext';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Home',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/my-courses',
    label: 'My Courses',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    path: '/bookmarks',
    label: 'Bookmarks',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const COLLAPSED_STORAGE_KEY = 'text-to-learn-sidebar-collapsed';

// Responsive defaults per breakpoint
function getDefaultCollapsed() {
  const w = window.innerWidth;
  if (w < 768) return true;   // mobile: hidden (off-canvas)
  if (w < 1024) return true;  // tablet: collapsed (rail)
  return false;               // desktop: expanded
}

export default function Sidebar() {
  const [isHoveringAppArea, setIsHoveringAppArea] = useState(false);
  const [hoverExpandTimer, setHoverExpandTimer] = useState(null);
  const [userCourses, setUserCourses] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [myCoursesOpen, setMyCoursesOpen] = useState(false);
  const [myCoursesFlyoutAnchor, setMyCoursesFlyoutAnchor] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();
  const { isMobileOpen, closeMobile, hideMobileDrawer, isCollapsed, toggleCollapsed, setCollapsed } = useSidebar();
  const sidebarRef = useRef(null);
  const navScrollRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const myCoursesBtnRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Fetch user courses
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

  // Refresh listener
  useEffect(() => {
    const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
    refreshCoursesEvent.addEventListener('refresh', handleRefresh);
    return () => refreshCoursesEvent.removeEventListener('refresh', handleRefresh);
  }, []);

  // When mobile drawer closes, reset hover state
  useEffect(() => {
    if (!isMobileOpen) setIsHoveringAppArea(false);
  }, [isMobileOpen]);

  const isMobileOpenRef = useRef(isMobileOpen);
  isMobileOpenRef.current = isMobileOpen;

  // When viewport crosses breakpoints, apply responsive defaults.
  // Also closes the mobile drawer when resizing up.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Transitioning to desktop: close mobile drawer without affecting collapsed state
        if (isMobileOpenRef.current) hideMobileDrawer();
      } else {
        // Transitioning to mobile: collapse sidebar for clean state
        setCollapsed(true);
        setIsHoveringAppArea(false);
        clearTimeout(hoverExpandTimer);
      }
    };
    handleResize(); // run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed, hideMobileDrawer, hoverExpandTimer]);

  // Hover-to-expand (flyout) with 200ms delay to prevent accidental triggers
  const handleHeaderMouseEnter = useCallback(() => {
    if (isCollapsed && window.innerWidth >= 1024) {
      const timer = setTimeout(() => {
        setCollapsed(false);
        setIsHoveringAppArea(true);
      }, 200);
      setHoverExpandTimer(timer);
    }
  }, [isCollapsed, setCollapsed]);

  const handleHeaderMouseLeave = useCallback(() => {
    clearTimeout(hoverExpandTimer);
    setHoverExpandTimer(null);
    setIsHoveringAppArea(false);
  }, [hoverExpandTimer]);

  // Close My Courses sub-menu whenever sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setMyCoursesOpen(false);
    }
  }, [isCollapsed]);

  // Click-outside-to-collapse (desktop only)
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector('aside[data-sidebar-desktop="true"]');
      if (sidebar && !isCollapsed && !sidebar.contains(e.target)) {
        setCollapsed(true);
        setIsHoveringAppArea(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCollapsed, setCollapsed]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!isMobileOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusableRef.current = firstFocusable;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMobile();
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);
    setTimeout(() => firstFocusable?.focus(), 100);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileOpen, closeMobile]);

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
    closeMobile();
  };

  const toggleSidebar = useCallback(() => {
    toggleCollapsed();
    setIsHoveringAppArea(false);
  }, [toggleCollapsed]);

  /*
   * Responsive strategy — two separate shells, CSS-driven:
   *
   *  Desktop (≥ 1024px / lg):  [data-sidebar-desktop]
   *    - sticky top-0, h-screen — stays visible while main content scrolls
   *    - overflow-hidden on shell, flex-1 + overflow-y-auto on nav area
   *    - Header and user section are flex-shrink-0 (never scroll away)
   *    - Collapsible 280px ↔ 72px
   *
   *  Mobile (< 1024px):         [data-sidebar-mobile]
   *    - Fixed drawer, slides in from left
   *    - Controlled by isMobileOpen state
   *    - Backdrop + focus trap
   *    - Auto-closes when resizing to desktop
   *
   *  Only ONE shell is visible at any breakpoint.
   */

  const desktopClasses = `
    hidden lg:flex flex-col
    sticky top-0 h-screen
    bg-[var(--sidebar-bg)] border-r-[var(--sidebar-border-width)] border-[var(--border-light)]
    transition-all duration-[var(--sidebar-transition-speed)] ease-in-out overflow-hidden
    ${isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'}
  `.trim();

  const mobileClasses = `
    lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col h-screen
    bg-[var(--sidebar-bg)] border-r-[var(--sidebar-border-width)] border-[var(--border-light)]
    transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `.trim();

  const navItemBase = `
    flex items-center gap-3 px-[var(--sidebar-padding-x)] h-10
    text-[var(--sidebar-text)] text-sm font-medium
    transition-colors duration-[var(--sidebar-transition-speed)] ease-in-out
    hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]
  `.trim();

  const navItemActive = `
    bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)] font-semibold
    border-l-[3px] border-l-[var(--sidebar-accent)]
  `.trim();

  /* ---- Shared render function for nav items (used by both shells) ---- */
  const renderNavItem = (item, index, isMobileVariant) => {
    const isItemActive = isActive(item.path);
    const isMyCourses = item.path === '/my-courses';

    return (
      <div key={item.path} role="none">
        <Link
          ref={isMyCourses ? myCoursesBtnRef : (index === 0 ? firstFocusableRef : undefined)}
          to={item.path}
          onMouseEnter={() => {
            if (isMyCourses && isCollapsed) {
              setMyCoursesFlyoutAnchor(myCoursesBtnRef.current);
            }
          }}
          onMouseLeave={() => {
            if (isMyCourses && isCollapsed) {
              setMyCoursesFlyoutAnchor(null);
            }
          }}
          onClick={(e) => {
            if (isMyCourses) {
              e.preventDefault();
              if (isCollapsed) {
                // Expand first, then open sub-menu after animation completes
                toggleCollapsed();
                setTimeout(() => setMyCoursesOpen(true), 200);
              } else {
                // Already expanded — toggle sub-menu
                setMyCoursesOpen(prev => !prev);
              }
            } else {
              closeMobile();
            }
          }}
          className={`${navItemBase} ${isItemActive && !isMyCourses ? navItemActive : ''}`}
          title={isCollapsed && !isMyCourses ? item.label : undefined}
          aria-current={isItemActive && !isMyCourses ? 'page' : undefined}
        >
          <span className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true">
            {item.icon}
          </span>
          <span
            className={`whitespace-nowrap overflow-hidden transition-all ease-in-out ${
              isCollapsed
                ? 'opacity-0 w-0 duration-[var(--sidebar-transition-speed)] delay-0'
                : 'opacity-100 w-auto duration-150'
            }`}
          >
            {item.label}
          </span>
          {isMyCourses && !isCollapsed && (
            <svg
              className={`w-4 h-4 ml-auto transition-transform duration-200 flex-shrink-0 ${
                myCoursesOpen ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </Link>

        {/* Inline sub-menu (expanded state) */}
        {isMyCourses && myCoursesOpen && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1" role="group" aria-label="Your courses">
            {userCourses.length > 0 ? (
              <>
                {userCourses.slice(0, 5).map((course) => (
                  <button
                    key={course.id || course._id}
                    onClick={(e) => handleCourseClick(course, e)}
                    className="w-full text-left px-3 py-2 text-[var(--text-tertiary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] transition-colors duration-[var(--sidebar-transition-speed)] text-sm rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
                  >
                    <div className="font-medium truncate">{course.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {course.modules_count} modules
                    </div>
                  </button>
                ))}
                {userCourses.length > 5 && (
                  <Link
                    to="/my-courses"
                    className="block px-3 py-2 text-xs text-[var(--accent-primary)] hover:underline transition-colors duration-[var(--sidebar-transition-speed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)]"
                    onClick={closeMobile}
                  >
                    View all {userCourses.length} courses →
                  </Link>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-[var(--text-muted)] mb-2">No courses yet</p>
                <Link
                  to="/"
                  className="text-xs text-[var(--accent-primary)] hover:underline transition-colors duration-[var(--sidebar-transition-speed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)]"
                  onClick={closeMobile}
                >
                  Generate your first course
                </Link>
              </div>
            )}
          </div>
        )}

        {index < NAV_ITEMS.length - 1 && (
          <div className="my-1 h-[1px] bg-[var(--border-light)] opacity-30" aria-hidden="true" />
        )}
      </div>
    );
  };

  /* ---- Shared header (brand + collapse toggle) ---- */
  const renderHeader = () => (
    <div
      className="h-16 flex items-center px-3 flex-shrink-0 relative border-b-[var(--sidebar-border-width)] border-[var(--border-light)] bg-[var(--sidebar-bg)]"
      onMouseEnter={handleHeaderMouseEnter}
      onMouseLeave={handleHeaderMouseLeave}
    >
      <button
        ref={firstFocusableRef}
        className={`w-10 h-10 bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-in-out hover:bg-[var(--accent-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)] ${
          isHoveringAppArea && !isCollapsed ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
        }`}
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Expand sidebar' : 'App menu'}
        aria-expanded={!isCollapsed}
      >
        <span className="text-white text-base font-bold" aria-hidden="true">T</span>
      </button>

      <button
        onClick={toggleSidebar}
        className="w-10 h-10 flex items-center justify-center transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--sidebar-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)] ml-auto"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {isCollapsed ? (
            <path d="M7 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M17 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>
    </div>
  );

  /* ---- Shared nav area ---- */
  const renderNav = () => (
    <nav
      ref={navScrollRef}
      className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden"
      aria-label="Primary navigation"
    >
      {NAV_ITEMS.map((item, index) => renderNavItem(item, index))}
    </nav>
  );

  /* ---- Shared user section ---- */
  const renderUserSection = () => (
    <div
      className="px-3 py-3 flex-shrink-0 overflow-hidden border-t-[var(--sidebar-border-width)] border-[var(--border-light)] bg-[var(--sidebar-bg)]"
      role="complementary"
      aria-label="User section"
    >
      {isLoading ? (
        <div className="flex items-center gap-3 py-2 min-h-[40px]">
          <div className="w-10 h-10 bg-[var(--bg-tertiary)] flex-shrink-0 animate-pulse" aria-hidden="true" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-[var(--bg-tertiary)] animate-pulse w-24 mb-1" aria-hidden="true" />
              <div className="h-3 bg-[var(--bg-tertiary)] animate-pulse w-16" aria-hidden="true" />
            </div>
          )}
        </div>
      ) : isAuthenticated && user ? (
        <div className="space-y-1">
          <div className="flex items-center gap-3 py-2 min-h-[40px]">
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=ff4d00&color=fff&size=80`}
              alt={user.name || 'User'}
              className="w-10 h-10 flex-shrink-0 object-cover border-2 border-[var(--border-light)]"
              style={{ minWidth: '40px', maxWidth: '40px' }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=ff4d00&color=fff&size=80`;
              }}
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => { logout(); closeMobile(); }}
            className="w-full flex items-center gap-3 h-10 text-sm text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--sidebar-hover-bg)] transition-colors duration-[var(--sidebar-transition-speed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
            aria-label="Sign Out"
          >
            <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-3 py-2 min-h-[40px]">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)]" style={{ minWidth: '40px', maxWidth: '40px' }} aria-hidden="true">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--text-primary)]">Guest</p>
              </div>
            )}
          </div>
          <button
            onClick={() => { login(); closeMobile(); }}
            className="w-full flex items-center gap-3 h-10 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--sidebar-hover-bg)] transition-colors duration-[var(--sidebar-transition-speed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
            aria-label="Sign In"
          >
            <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {!isCollapsed && <span>Sign In</span>}
          </button>
        </div>
      )}
    </div>
  );

  /* ---- Render ---- */
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar — hidden on mobile, visible on lg+ */}
      <aside
        data-sidebar-desktop="true"
        className={desktopClasses}
        role="navigation"
        aria-label="Main navigation"
      >
        {renderHeader()}
        {renderNav()}
        {renderUserSection()}
      </aside>

      {/* Flyout popover for "My Courses" when collapsed — desktop only */}
      {myCoursesFlyoutAnchor && isCollapsed && userCourses.length > 0 && (
        <div
          className="hidden lg:block fixed z-50 card p-2 shadow-lg w-64 animate-fade-in"
          role="group"
          aria-label="Your courses"
          style={{ left: '76px' }}
          onMouseEnter={() => setMyCoursesFlyoutAnchor(myCoursesFlyoutAnchor)}
          onMouseLeave={() => setMyCoursesFlyoutAnchor(null)}
        >
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase px-2 pt-1 pb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            Your Courses
          </p>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {userCourses.slice(0, 8).map((course) => (
              <button
                key={course.id || course._id}
                onClick={(e) => {
                  handleCourseClick(course, e);
                  setMyCoursesFlyoutAnchor(null);
                }}
                className="w-full text-left px-2 py-2 text-sm text-[var(--text-tertiary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] transition-colors rounded-none"
              >
                <div className="font-medium truncate">{course.title}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {course.modules_count} modules
                </div>
              </button>
            ))}
            {userCourses.length > 8 && (
              <Link
                to="/my-courses"
                className="block px-2 py-2 text-xs text-[var(--accent-primary)] hover:underline"
                onClick={closeMobile}
              >
                View all {userCourses.length} courses →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Mobile drawer — visible on mobile only, hidden on lg+ */}
      <aside
        ref={sidebarRef}
        data-sidebar-mobile="true"
        className={mobileClasses}
        role="dialog"
        aria-label="Main navigation"
        aria-modal="true"
      >
        {renderHeader()}
        {renderNav()}
        {renderUserSection()}
      </aside>
    </>
  );
}
