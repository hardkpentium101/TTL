/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext();
const COLLAPSED_KEY = 'text-to-learn-sidebar-collapsed';

// Helper to handle localStorage safely across environments
const getStorageItem = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export function SidebarProvider({ children }) {
  // 1. Initialize state lazily to avoid SSR mismatch
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const persisted = getStorageItem(COLLAPSED_KEY);
    if (persisted !== null) return persisted;
    // Default to expanded (false) — no localStorage means first visit
    return false;
  });

  // 2. Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // 3. Handle window resizing to keep state sane
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false); // Close drawer on resize to mobile
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => {
      const opening = !prev;
      // Expand sidebar immediately when opening mobile drawer
      if (opening) setIsCollapsed(false);
      return opening;
    });
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
    setIsCollapsed(true); // close drawer: reset for next open
  }, []);

  // Close mobile drawer WITHOUT affecting collapsed state
  // Used by resize handler when transitioning to desktop
  const hideMobileDrawer = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const setCollapsed = useCallback((value) => {
    setIsCollapsed(value);
  }, []);

  return (
    <SidebarContext.Provider value={{
      isMobileOpen,
      toggleMobile,
      closeMobile,
      hideMobileDrawer,
      isCollapsed,
      toggleCollapsed,
      setCollapsed,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

export function SidebarMobileToggle() {
  const { toggleMobile, isMobileOpen } = useSidebar();

  return (
    <button
      onClick={toggleMobile}
      className="lg:hidden p-2 rounded-none border-2 border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
      aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      aria-expanded={isMobileOpen}
    >
      <svg
        className="w-5 h-5 text-[var(--text-primary)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
