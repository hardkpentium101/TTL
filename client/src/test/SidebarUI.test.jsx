import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { SidebarProvider } from '../context/SidebarContext';

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

const wrapper = ({ children }) => (
  <BrowserRouter>
    <SidebarProvider>
      {children}
    </SidebarProvider>
  </BrowserRouter>
);

// Helper: get the desktop aside (data-sidebar-desktop)
function getDesktopSidebar() {
  return document.querySelector('[data-sidebar-desktop="true"]');
}

// Helper: get all desktop nav links
function getDesktopNavLinks() {
  const sidebar = getDesktopSidebar();
  return sidebar ? sidebar.querySelectorAll('nav a[role="menuitem"]') : [];
}

describe('Sidebar - Consistent Icon Sizing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should have all nav icons at consistent size (18px)', () => {
    render(<Sidebar />, { wrapper });
    const navIconSpans = getDesktopNavLinks();
    expect(navIconSpans.length).toBeGreaterThan(0);
    navIconSpans.forEach(link => {
      const iconSpan = link.querySelector('span:first-child');
      expect(iconSpan).toBeTruthy();
      expect(iconSpan?.className).toContain('w-[18px]');
      expect(iconSpan?.className).toContain('h-[18px]');
    });
  });

  it('should have all nav rows at h-10 (40px)', () => {
    render(<Sidebar />, { wrapper });
    const navRows = getDesktopNavLinks();
    expect(navRows.length).toBeGreaterThan(0);
    navRows.forEach(row => {
      expect(row.className).toContain('h-10');
    });
  });

  it('should have app icon button at w-10 h-10', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    // In collapsed state, the app icon button has aria-label="Expand sidebar"
    // In expanded state, it has aria-label="App menu"
    const appIconBtn = sidebar?.querySelector('button[aria-label="App menu"], button[aria-label="Expand sidebar"]');
    // If there are two "Expand sidebar" buttons (icon + chevron), pick the one with accent bg
    const allBtns = sidebar?.querySelectorAll('button[aria-label="Expand sidebar"]');
    const target = allBtns?.length === 2
      ? Array.from(allBtns).find(btn => btn.className.includes('bg-[var(--accent-primary)]'))
      : appIconBtn;
    expect(target).toBeTruthy();
    expect(target?.className).toContain('w-10');
    expect(target?.className).toContain('h-10');
    expect(target?.className).toContain('bg-[var(--accent-primary)]');
  });

  it('should have sign in button at h-10', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const signInBtn = sidebar?.querySelector('button[aria-label="Sign In"]');
    expect(signInBtn).toBeTruthy();
    expect(signInBtn?.className).toContain('h-10');
  });
});

describe('Sidebar - No Icon Backgrounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should not have background on nav icons', () => {
    render(<Sidebar />, { wrapper });
    const navIconSpan = getDesktopNavLinks()[0]?.querySelector('span');
    expect(navIconSpan).toBeTruthy();
    expect(navIconSpan?.className).not.toContain('bg-[');
    expect(navIconSpan?.className).not.toContain('rounded');
  });

  it('should not have gradient background on collapse toggle button', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const toggleBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    expect(toggleBtn).toBeTruthy();
    expect(toggleBtn?.className).not.toContain('bg-gradient');
    expect(toggleBtn?.className).not.toContain('rounded-xl');
  });

  it('should not have default background on sign in button', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const signInBtn = sidebar?.querySelector('button[aria-label="Sign In"]');
    expect(signInBtn).toBeTruthy();
    const classList = signInBtn.className.split(' ');
    const defaultBgClasses = classList.filter(c => c.startsWith('bg-') && !c.startsWith('hover:'));
    expect(defaultBgClasses.length).toBe(0);
  });
});

describe('Sidebar - Default Collapsed State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should render sidebar collapsed by default', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    expect(sidebar?.className).toContain('w-[var(--sidebar-collapsed-width)]');
  });

  it('should show expand toggle button when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    expect(expandBtn).toBeTruthy();
  });

  it('should NOT show app name in sidebar', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    expect(sidebar?.textContent).not.toContain('Text-to-Learn');
  });

  it('should hide nav labels when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const navLinks = getDesktopNavLinks();
    expect(navLinks.length).toBeGreaterThan(0);
    const firstLink = navLinks[0];
    const labels = firstLink.querySelectorAll('span');
    const hiddenLabels = Array.from(labels).filter(s => s.className.includes('opacity-0'));
    expect(hiddenLabels.length).toBeGreaterThan(0);
  });
});

describe('Sidebar - Toggle Expand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should expand sidebar when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    expect(sidebar?.className).toContain('w-[var(--sidebar-collapsed-width)]');

    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    expect(sidebar?.className).toContain('w-[var(--sidebar-width)]');
  });

  it('should show collapse button when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    const collapseBtn = sidebar?.querySelector('button[aria-label="Collapse sidebar"]');
    expect(collapseBtn).toBeTruthy();
  });

  it('should show nav labels when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    expect(sidebar?.textContent).toContain('Home');
    expect(sidebar?.textContent).toContain('My Courses');
    expect(sidebar?.textContent).toContain('Bookmarks');
  });

  it('should collapse when collapse button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    expect(sidebar?.className).toContain('w-[var(--sidebar-width)]');

    const collapseBtn = sidebar?.querySelector('button[aria-label="Collapse sidebar"]');
    await user.click(collapseBtn);

    expect(sidebar?.className).toContain('w-[var(--sidebar-collapsed-width)]');
  });
});

describe('Sidebar - Click Outside to Collapse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should collapse sidebar when clicking outside', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    expect(sidebar?.className).toContain('w-[var(--sidebar-width)]');

    fireEvent.mouseDown(document.body);

    expect(sidebar?.className).toContain('w-[var(--sidebar-collapsed-width)]');
  });

  it('should NOT collapse when clicking inside sidebar', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    expect(sidebar?.className).toContain('w-[var(--sidebar-width)]');

    fireEvent.mouseDown(sidebar);

    expect(sidebar?.className).toContain('w-[var(--sidebar-width)]');
  });
});

describe('Sidebar - Expanded State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show collapse toggle on RIGHT when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    await user.click(expandBtn);

    const collapseBtn = sidebar?.querySelector('button[aria-label="Collapse sidebar"]');
    expect(collapseBtn?.className).toContain('ml-auto');
  });

  it('should have aria-expanded attribute reflecting state', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();

    // Collapsed state
    const expandBtn = sidebar?.querySelector('button[aria-label="Expand sidebar"]');
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');

    // Expand
    await user.click(expandBtn);

    // Expanded state
    const collapseBtn = sidebar?.querySelector('button[aria-label="Collapse sidebar"]');
    expect(collapseBtn).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Sidebar - Active Section Styling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have active styling for current page nav item', () => {
    mockLocationPathname = '/';
    render(<Sidebar />, { wrapper });
    const activeLink = getDesktopSidebar()?.querySelector('nav a[href="/"]');
    expect(activeLink?.className).toContain('bg-[var(--sidebar-active-bg)]');
    expect(activeLink?.className).toContain('border-l-[3px]');
    expect(activeLink?.className).toContain('border-l-[var(--sidebar-accent)]');
    expect(activeLink?.className).toContain('font-semibold');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('should have hover state for non-active nav items', () => {
    mockLocationPathname = '/';
    render(<Sidebar />, { wrapper });
    const inactiveLink = getDesktopSidebar()?.querySelector('nav a[href="/bookmarks"]');
    expect(inactiveLink?.className).toContain('hover:bg-[var(--sidebar-hover-bg)]');
    expect(inactiveLink?.className).toContain('hover:text-[var(--sidebar-text-active)]');
  });
});

describe('Sidebar - Collapsed Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show tooltips for nav items when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const homeLink = getDesktopSidebar()?.querySelector('nav a[href="/"]');
    expect(homeLink).toHaveAttribute('title', 'Home');
  });

  it('should hide nav labels with opacity-0 and w-0 when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const activeLink = getDesktopSidebar()?.querySelector('nav a[href="/"]');
    const labelSpan = activeLink?.querySelector('span:last-child');
    expect(labelSpan?.className).toContain('opacity-0');
    expect(labelSpan?.className).toContain('w-0');
  });
});

describe('Sidebar - User Section (Guest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show guest user section in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const userSection = sidebar?.querySelector('[aria-label="User section"]');
    expect(userSection).toBeInTheDocument();
    expect(userSection?.querySelector('svg')).toBeInTheDocument();
  });

  it('should show sign in button in guest state', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const signInBtn = sidebar?.querySelector('button[aria-label="Sign In"]');
    expect(signInBtn).toBeTruthy();
    expect(signInBtn?.className).toContain('h-10');
  });
});

describe('Sidebar - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should have proper nav role and aria-label', () => {
    render(<Sidebar />, { wrapper });
    const nav = getDesktopSidebar()?.querySelector('nav[aria-label="Primary navigation"]');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('role', 'menu');
  });

  it('should have aria-current on active link', () => {
    mockLocationPathname = '/';
    render(<Sidebar />, { wrapper });
    const activeLink = getDesktopSidebar()?.querySelector('nav a[href="/"]');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('should have aria-expanded on toggle buttons', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const toggleButtons = sidebar?.querySelectorAll('button[aria-expanded]');
    expect(toggleButtons?.length).toBeGreaterThan(0);
    toggleButtons?.forEach(btn => {
      expect(btn).toHaveAttribute('aria-expanded');
    });
  });

  it('should have focus-visible ring styles on interactive elements', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = getDesktopSidebar();
    const buttons = sidebar?.querySelectorAll('button');
    buttons?.forEach(btn => {
      expect(btn.className).toContain('focus-visible:outline-none');
      expect(btn.className).toContain('focus-visible:ring');
    });
  });

  it('should have menuitem role on nav links', () => {
    render(<Sidebar />, { wrapper });
    const navLinks = getDesktopNavLinks();
    expect(navLinks.length).toBeGreaterThan(0);
  });
});
