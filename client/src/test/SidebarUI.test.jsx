import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { SidebarMobileToggle } from '../context/SidebarContext';
import { SidebarProvider } from '../context/SidebarContext';

/* ==========================================================================
   MOCKS
   ========================================================================== */

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
    getAccessTokenWithPopup: vi.fn().mockResolvedValue('mock-token'),
  }),
  Auth0Provider: ({ children }) => children,
}));

const mockNavigate = vi.fn();
let mockLocationPathname = '/';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockLocationPathname }),
  };
});

vi.mock('../utils/api', () => ({
  generateCourseAsync: vi.fn(),
  waitForCourse: vi.fn(),
  getCourseById: vi.fn(),
  getUserCourses: vi.fn().mockResolvedValue({ courses: [] }),
  getOrCreateUser: vi.fn().mockResolvedValue({ user: { id: '1', name: 'Test User' } }),
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../events', () => ({
  refreshCoursesEvent: {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
}));

/* ==========================================================================
   HELPERS
   ========================================================================== */

const wrapper = ({ children }) => (
  <BrowserRouter>
    <SidebarProvider>
      {children}
    </SidebarProvider>
  </BrowserRouter>
);

const getDesktop = () => document.querySelector('[data-sidebar-desktop="true"]');
const getMobile = () => document.querySelector('[data-sidebar-mobile="true"]');
const getNavLinks = () => getDesktop()?.querySelectorAll('nav a') || [];

// Control initial state via localStorage — this is the authoritative source
// for collapsed preference. When no preference is stored, the provider falls
// back to window.innerWidth. For test reliability, we explicitly set it.
const resetState = () => {
  localStorage.removeItem('text-to-learn-sidebar-collapsed');
  mockLocationPathname = '/';
  vi.clearAllMocks();
};

const setExpanded = () => {
  localStorage.setItem('text-to-learn-sidebar-collapsed', 'false');
};

const setCollapsed = () => {
  localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
};

beforeEach(() => {
  resetState();
});
afterEach(resetState);

/* ==========================================================================
   A. BREAKPOINTS & MODES
   ========================================================================== */

describe('A. Breakpoints & Modes', () => {
  it('renders desktop sidebar on large screens (hidden via CSS but in DOM)', () => {
    render(<Sidebar />, { wrapper });
    const desktop = getDesktop();
    expect(desktop).toBeInTheDocument();
    expect(desktop).toHaveAttribute('data-sidebar-desktop', 'true');
  });

  it('renders mobile drawer in DOM (hidden via CSS on desktop)', () => {
    render(<Sidebar />, { wrapper });
    const mobile = getMobile();
    expect(mobile).toBeInTheDocument();
    expect(mobile).toHaveAttribute('data-sidebar-mobile', 'true');
  });

  it('desktop sidebar has sticky positioning and h-screen', () => {
    render(<Sidebar />, { wrapper });
    const cls = getDesktop()?.className || '';
    expect(cls).toContain('sticky');
    expect(cls).toContain('top-0');
    expect(cls).toContain('h-screen');
  });

  it('mobile drawer has fixed positioning and full height', () => {
    render(<Sidebar />, { wrapper });
    const cls = getMobile()?.className || '';
    expect(cls).toContain('fixed');
    expect(cls).toContain('inset-y-0');
    expect(cls).toContain('h-screen');
  });
});

/* ==========================================================================
   B. DESKTOP BEHAVIOUR
   ========================================================================== */

describe('B. Desktop Behaviour', () => {
  describe('B1. Default state — expanded on first visit', () => {
    it('sidebar is expanded (280px) when no localStorage value exists', () => {
      localStorage.removeItem('text-to-learn-sidebar-collapsed');
      render(<Sidebar />, { wrapper });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-width)]');
      expect(cls).not.toContain('w-[var(--sidebar-collapsed-width)]');
    });

    it('shows nav labels by default', () => {
      render(<Sidebar />, { wrapper });
      expect(getDesktop()?.textContent).toContain('Home');
      expect(getDesktop()?.textContent).toContain('Bookmarks');
    });

    it('shows collapse toggle (chevron pointing left) by default', () => {
      render(<Sidebar />, { wrapper });
      expect(getDesktop()?.querySelector('button[aria-label="Collapse sidebar"]')).toBeTruthy();
    });
  });

  describe('B2. Persistence via localStorage', () => {
    it('remembers collapsed preference across renders', () => {
      // First render: collapse
      const { unmount } = render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      const collapseBtn = desktop?.querySelector('button[aria-label="Collapse sidebar"]');
      if (collapseBtn) fireEvent.click(collapseBtn);
      unmount();

      // Second render: should still be collapsed
      render(<Sidebar />, { wrapper });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-collapsed-width)]');
    });

    it('loads persisted expanded preference', () => {
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'false');
      render(<Sidebar />, { wrapper });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-width)]');
    });

    it('loads persisted collapsed preference', () => {
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
      render(<Sidebar />, { wrapper });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-collapsed-width)]');
    });
  });

  describe('B3. Toggle collapse/expand', () => {
    it('collapses when chevron button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      const btn = desktop?.querySelector('button[aria-label="Collapse sidebar"]');
      await user.click(btn);
      expect(desktop?.className).toContain('w-[var(--sidebar-collapsed-width)]');
    });

    it('expands when chevron button is clicked while collapsed', async () => {
      const user = userEvent.setup();
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      const btn = desktop?.querySelector('button[aria-label="Expand sidebar"]');
      await user.click(btn);
      expect(desktop?.className).toContain('w-[var(--sidebar-width)]');
    });

    it('app icon button also toggles collapse/expand', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      const appIconBtn = desktop?.querySelector('button[aria-label="App menu"]');
      await user.click(appIconBtn);
      expect(desktop?.className).toContain('w-[var(--sidebar-collapsed-width)]');
    });
  });

  describe('B4. Hover-to-expand (200ms delay)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('does NOT expand immediately on hover (before delay)', () => {
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
      render(<Sidebar />, { wrapper });
      const header = getDesktop()?.querySelector('[class*="h-16"]');
      fireEvent.mouseEnter(header);
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-collapsed-width)]');
    });

    it('expands after 200ms hover delay', () => {
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
      render(<Sidebar />, { wrapper });
      const header = getDesktop()?.querySelector('[class*="h-16"]');
      fireEvent.mouseEnter(header);
      act(() => { vi.advanceTimersByTime(200); });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-width)]');
    });

    it('cancels expand if mouse leaves before delay', () => {
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
      render(<Sidebar />, { wrapper });
      const header = getDesktop()?.querySelector('[class*="h-16"]');
      fireEvent.mouseEnter(header);
      fireEvent.mouseLeave(header);
      act(() => { vi.advanceTimersByTime(300); });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('w-[var(--sidebar-collapsed-width)]');
    });
  });

  describe('B5. Click-outside-to-collapse', () => {
    it('collapses sidebar when clicking outside', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      // Ensure expanded
      const collapseBtn = desktop?.querySelector('button[aria-label="Collapse sidebar"]');
      expect(collapseBtn).toBeTruthy();

      fireEvent.mouseDown(document.body);
      expect(desktop?.className).toContain('w-[var(--sidebar-collapsed-width)]');
    });

    it('does NOT collapse when clicking inside sidebar', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      expect(desktop?.className).toContain('w-[var(--sidebar-width)]');

      fireEvent.mouseDown(desktop);
      expect(desktop?.className).toContain('w-[var(--sidebar-width)]');
    });
  });

  describe('B6. Content push — main content area resizes', () => {
    it('desktop sidebar uses sticky positioning so content flows around it', () => {
      render(<Sidebar />, { wrapper });
      const cls = getDesktop()?.className || '';
      expect(cls).toContain('sticky');
      expect(cls).toContain('top-0');
    });
  });

  describe('B7. Independent scroll for nav area', () => {
    it('header section is flex-shrink-0 (does not scroll)', () => {
      render(<Sidebar />, { wrapper });
      const header = getDesktop()?.querySelector('[class*="h-16"]');
      expect(header?.className).toContain('flex-shrink-0');
    });

    it('user section is flex-shrink-0 (does not scroll)', () => {
      render(<Sidebar />, { wrapper });
      const userSection = getDesktop()?.querySelector('[aria-label="User section"]');
      expect(userSection?.className).toContain('flex-shrink-0');
    });

    it('nav area has overflow-y-auto for independent scrolling', () => {
      render(<Sidebar />, { wrapper });
      const nav = getDesktop()?.querySelector('nav[aria-label="Primary navigation"]');
      expect(nav?.className).toContain('overflow-y-auto');
    });
  });

  describe('B8. Label animation timing', () => {
    it('collapsed state: labels have opacity-0 and w-0', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      const btn = desktop?.querySelector('button[aria-label="Collapse sidebar"]');
      await user.click(btn);

      const link = desktop?.querySelector('nav a[href="/"]');
      const label = link?.querySelector('span:last-child');
      expect(label?.className).toContain('opacity-0');
      expect(label?.className).toContain('w-0');
    });

    it('expanded state: labels have opacity-100 and w-auto', () => {
      render(<Sidebar />, { wrapper });
      const link = getDesktop()?.querySelector('nav a[href="/"]');
      const label = link?.querySelector('span:last-child');
      expect(label?.className).toContain('opacity-100');
      expect(label?.className).toContain('w-auto');
    });
  });

  describe('B9. My Courses sub-menu', () => {
    it('clicking My Courses opens inline sub-menu when expanded', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const link = getDesktop()?.querySelector('nav a[href="/my-courses"]');
      await user.click(link);

      const group = getDesktop()?.querySelector('[role="group"][aria-label="Your courses"]');
      expect(group).toBeTruthy();
    });

    it('clicking My Courses when collapsed first expands, then opens sub-menu', async () => {
      const user = userEvent.setup();
      localStorage.setItem('text-to-learn-sidebar-collapsed', 'true');
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      expect(desktop?.className).toContain('w-[var(--sidebar-collapsed-width)]');

      const link = desktop?.querySelector('nav a[href="/my-courses"]');
      await user.click(link);

      expect(desktop?.className).toContain('w-[var(--sidebar-width)]');
      const group = desktop?.querySelector('[role="group"][aria-label="Your courses"]');
      expect(group).toBeTruthy();
    });

    it('sub-menu closes when sidebar is collapsed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      // Open sub-menu
      const link = getDesktop()?.querySelector('nav a[href="/my-courses"]');
      await user.click(link);
      expect(getDesktop()?.querySelector('[role="group"]')).toBeTruthy();

      // Collapse
      const collapseBtn = getDesktop()?.querySelector('button[aria-label="Collapse sidebar"]');
      await user.click(collapseBtn);

      expect(getDesktop()?.querySelector('[role="group"]')).toBeFalsy();
    });
  });

  describe('B10. Tooltips on collapsed items', () => {
    it('collapsed nav items have title attribute for tooltips', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      const btn = desktop?.querySelector('button[aria-label="Collapse sidebar"]');
      await user.click(btn);

      const bookmarksLink = desktop?.querySelector('nav a[href="/bookmarks"]');
      expect(bookmarksLink).toHaveAttribute('title', 'Bookmarks');
    });

    it('expanded nav items do NOT have title attribute', () => {
      render(<Sidebar />, { wrapper });
      const link = getDesktop()?.querySelector('nav a[href="/bookmarks"]');
      expect(link).not.toHaveAttribute('title');
    });
  });

  describe('B11. Active state styling', () => {
    it('active nav item has aria-current="page"', () => {
      mockLocationPathname = '/';
      render(<Sidebar />, { wrapper });
      const link = getDesktop()?.querySelector('nav a[href="/"]');
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('active nav item has left accent bar and tinted background', () => {
      mockLocationPathname = '/';
      render(<Sidebar />, { wrapper });
      const link = getDesktop()?.querySelector('nav a[href="/"]');
      const cls = link?.className || '';
      expect(cls).toContain('border-l-[3px]');
      expect(cls).toContain('border-l-[var(--sidebar-accent)]');
      expect(cls).toContain('bg-[var(--sidebar-active-bg)]');
      expect(cls).toContain('font-semibold');
    });

    it('inactive nav items do NOT have active styling', () => {
      mockLocationPathname = '/';
      render(<Sidebar />, { wrapper });
      const link = getDesktop()?.querySelector('nav a[href="/bookmarks"]');
      const cls = link?.className || '';
      expect(cls).not.toContain('border-l-[var(--sidebar-accent)]');
      expect(cls).not.toContain('bg-[var(--sidebar-active-bg)]');
    });
  });
});

/* ==========================================================================
   C. MOBILE BEHAVIOUR
   ========================================================================== */

describe('C. Mobile Behaviour', () => {
  // Mobile hamburger lives outside Sidebar (in App.jsx), so render it alongside
  const MobileWrapper = ({ children }) => (
    <BrowserRouter>
      <SidebarProvider>
        <SidebarMobileToggle />
        <Sidebar />
      </SidebarProvider>
    </BrowserRouter>
  );

  beforeEach(() => {
    resetState();
    setCollapsed(); // mobile starts collapsed
  });

  afterEach(resetState);

  describe('C1. Hidden by default', () => {
    it('mobile drawer is off-screen (translate-x-full) when closed', () => {
      render(<Sidebar />, { wrapper });
      const cls = getMobile()?.className || '';
      expect(cls).toContain('-translate-x-full');
    });

    it('no backdrop is rendered when drawer is closed', () => {
      render(<Sidebar />, { wrapper });
      const backdrop = document.querySelector('[class*="bg-black/50"]');
      expect(backdrop).toBeFalsy();
    });
  });

  describe('C2. Hamburger toggle', () => {
    it('clicking hamburger opens mobile drawer', async () => {
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(toggle);

      await vi.waitFor(() => {
        const mobile = getMobile();
        expect(mobile?.className).toContain('translate-x-0');
      });
    });

    it('renders backdrop when drawer is open', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        const backdrop = document.querySelector('[class*="bg-black/50"]');
        expect(backdrop).toBeTruthy();
      });
    });

    it('clicking backdrop closes drawer', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        const backdrop = document.querySelector('[class*="bg-black/50"]');
        expect(backdrop).toBeTruthy();
      });

      const backdrop = document.querySelector('[class*="bg-black/50"]');
      await user.click(backdrop);

      await vi.waitFor(() => {
        expect(getMobile()?.className).toContain('-translate-x-full');
      });
    });
  });

  describe('C3. Dynamic aria-label on hamburger', () => {
    it('says "Open menu" when closed', () => {
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('says "Close menu" when open', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        const closeToggle = screen.getByRole('button', { name: /close menu/i });
        expect(closeToggle).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('C4. Focus trap & Escape key', () => {
    it('mobile drawer has role="dialog" and aria-modal="true"', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        const mobile = getMobile();
        expect(mobile).toHaveAttribute('role', 'dialog');
        expect(mobile).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('pressing Escape closes mobile drawer', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        expect(getMobile()?.className).toContain('translate-x-0');
      });

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(getMobile()?.className).toContain('-translate-x-full');
    });
  });

  describe('C5. Mobile drawer shows full labels (never collapsed/rail)', () => {
    it('mobile drawer renders all 4 nav item labels', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        const text = getMobile()?.textContent || '';
        expect(text).toContain('Home');
        expect(text).toContain('My Courses');
        expect(text).toContain('Bookmarks');
        expect(text).toContain('Settings');
      });
    });

    it('mobile drawer shows user section labels', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        expect(getMobile()?.textContent).toContain('Guest');
      });
    });
  });

  describe('C6. Responsive resize behavior', () => {
    it('closes mobile drawer when resizing to desktop width', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      await vi.waitFor(() => {
        expect(getMobile()?.className).toContain('translate-x-0');
      });

      // Simulate resize to desktop width — should close the drawer
      // @ts-ignore
      window.innerWidth = 1200;
      fireEvent.resize(window);

      expect(getMobile()?.className).toContain('-translate-x-full');
    });

    it('collapses desktop sidebar when resizing to mobile width', () => {
      // Clear localStorage so sidebar starts expanded
      localStorage.removeItem('text-to-learn-sidebar-collapsed');
      render(<Sidebar />, { wrapper });
      const desktop = getDesktop();
      expect(desktop?.className).toContain('w-[var(--sidebar-width)]');

      // Simulate resize to mobile
      // @ts-ignore
      window.innerWidth = 375;
      fireEvent.resize(window);

      expect(desktop?.className).toContain('w-[var(--sidebar-collapsed-width)]');
    });
  });

  describe('C7. Mobile drawer z-index layering', () => {
    it('mobile drawer has z-50 (above most content)', () => {
      render(<Sidebar />, { wrapper });
      const cls = getMobile()?.className || '';
      expect(cls).toContain('z-50');
    });

    it('backdrop has z-40 (below drawer but above content)', async () => {
      const user = userEvent.setup();
      render(<MobileWrapper />);
      const toggle = screen.getByRole('button', { name: /open menu/i });
      await user.click(toggle);

      const backdrop = document.querySelector('[class*="bg-black/50"]');
      expect(backdrop?.className).toContain('z-40');
    });
  });

  describe('C8. Mobile drawer scroll behavior', () => {
    it('mobile drawer has full viewport height (h-screen)', () => {
      render(<Sidebar />, { wrapper });
      const cls = getMobile()?.className || '';
      expect(cls).toContain('h-screen');
    });

    it('mobile drawer nav area has overflow-y-auto for scrolling', () => {
      render(<Sidebar />, { wrapper });
      const nav = getMobile()?.querySelector('nav');
      expect(nav?.className).toContain('overflow-y-auto');
    });
  });

  describe('C9. No hover-to-expand on mobile (touch devices)', () => {
    it('mouseEnter on header does NOT expand mobile drawer', () => {
      render(<MobileWrapper />);
      const mobile = getMobile();
      expect(mobile?.className).toContain('-translate-x-full');

      const header = getMobile()?.querySelector('[class*="h-16"]');
      fireEvent.mouseEnter(header);

      // Should still be closed — no hover behavior on mobile
      expect(mobile?.className).toContain('-translate-x-full');
    });
  });
});

/* ==========================================================================
   D. CONTENT & SECTIONS
   ========================================================================== */

describe('D. Content & Sections', () => {
  it('renders 4 nav items: Home, My Courses, Bookmarks, Settings', () => {
    render(<Sidebar />, { wrapper });
    const links = getNavLinks();
    expect(links.length).toBe(4);
    const texts = Array.from(links).map(l => l.textContent?.trim());
    expect(texts).toContain('Home');
    expect(texts).toContain('My Courses');
    expect(texts).toContain('Bookmarks');
    expect(texts).toContain('Settings');
  });

  it('has a user section with aria-label', () => {
    render(<Sidebar />, { wrapper });
    expect(getDesktop()?.querySelector('[aria-label="User section"]')).toBeTruthy();
  });

  it('has a header section with brand icon and toggle', () => {
    render(<Sidebar />, { wrapper });
    const desktop = getDesktop();
    // Header is the top section of the sidebar
    const header = desktop?.querySelector('div[class*="flex-shrink-0"]');
    expect(header).toBeTruthy();
    // Should have at least one toggle button
    const toggles = header?.querySelectorAll('button[aria-label]');
    expect(toggles?.length).toBeGreaterThan(0);
  });

  it('separators exist between nav items', () => {
    render(<Sidebar />, { wrapper });
    const separators = getDesktop()?.querySelectorAll('[aria-hidden="true"]');
    const sepCount = Array.from(separators || []).filter(
      el => el.getAttribute('class')?.includes('h-[1px]')
    ).length;
    expect(sepCount).toBeGreaterThanOrEqual(2);
  });
});

/* ==========================================================================
   E. ACCESSIBILITY
   ========================================================================== */

describe('E. Accessibility', () => {
  it('desktop sidebar has role="navigation"', () => {
    render(<Sidebar />, { wrapper });
    expect(getDesktop()).toHaveAttribute('role', 'navigation');
  });

  it('desktop sidebar has aria-label="Main navigation"', () => {
    render(<Sidebar />, { wrapper });
    expect(getDesktop()).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('all toggle buttons have aria-expanded', () => {
    render(<Sidebar />, { wrapper });
    const toggles = getDesktop()?.querySelectorAll('button[aria-expanded]');
    expect(toggles?.length).toBeGreaterThan(0);
    toggles?.forEach(btn => {
      expect(btn).toHaveAttribute('aria-expanded');
    });
  });

  it('all interactive elements have focus-visible ring styles', () => {
    render(<Sidebar />, { wrapper });
    const buttons = getDesktop()?.querySelectorAll('button');
    buttons?.forEach(btn => {
      expect(btn.className).toContain('focus-visible:outline-none');
      expect(btn.className).toContain('focus-visible:ring');
    });
  });

  it('active nav link has semantic <nav> parent', () => {
    render(<Sidebar />, { wrapper });
    const nav = getDesktop()?.querySelector('nav');
    expect(nav?.tagName).toBe('NAV');
  });
});
