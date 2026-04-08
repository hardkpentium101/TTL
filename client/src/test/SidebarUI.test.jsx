import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

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
    {children}
  </BrowserRouter>
);

describe('Sidebar - Consistent Icon Sizing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should have all nav icons at w-5 h-5', () => {
    render(<Sidebar />, { wrapper });
    const navIconSpans = document.querySelectorAll('aside nav a > span:first-child');
    navIconSpans.forEach(span => {
      expect(span.className).toContain('w-5');
      expect(span.className).toContain('h-5');
    });
  });

  it('should have all nav rows at h-10 (40px)', () => {
    render(<Sidebar />, { wrapper });
    const navRows = document.querySelectorAll('aside nav a');
    navRows.forEach(row => {
      expect(row.className).toContain('h-10');
    });
  });

  it('should have app icon at w-10 h-10 (matching nav row height)', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    expect(appIcon.className).toContain('w-10');
    expect(appIcon.className).toContain('h-10');
  });

  it('should have expander button at w-10 h-10 (matching nav row height)', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expanderBtn.className).toContain('w-10');
    expect(expanderBtn.className).toContain('h-10');
  });

  it('should have guest icon at w-10 h-10 (matching nav row height)', () => {
    render(<Sidebar />, { wrapper });
    const guestIcon = document.querySelector('[data-guest-icon="true"]');
    expect(guestIcon.className).toContain('w-10');
    expect(guestIcon.className).toContain('h-10');
  });

  it('should have sign in button at h-10 in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    expect(signInBtn.className).toContain('h-10');
  });
});

describe('Sidebar - No Icon Backgrounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should not have background on nav icons', () => {
    render(<Sidebar />, { wrapper });
    const navIconSpan = document.querySelector('aside nav a[href="/"] > span');
    expect(navIconSpan.className).not.toContain('bg-');
    expect(navIconSpan.className).not.toContain('rounded');
  });

  it('should not have background on expander button', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    // Expander should not have gradient background or highlighted bg
    expect(expanderBtn.className).not.toContain('bg-gradient');
    expect(expanderBtn.className).not.toContain('rounded-xl');
  });

  it('should not have background on sign in icon', () => {
    render(<Sidebar />, { wrapper });
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    // Should not have any background color class
    expect(signInBtn.className).not.toContain('bg-[');
  });
});

describe('Sidebar - Default Collapsed State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should render sidebar collapsed (72px) by default', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = document.querySelector('aside');
    expect(sidebar.className).toContain('w-[72px]');
  });

  it('should show app icon on the LEFT when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    expect(appIcon).toBeInTheDocument();
  });

  it('should NOT show app name in sidebar', () => {
    render(<Sidebar />, { wrapper });
    const sidebar = document.querySelector('aside');
    const topSection = sidebar.querySelector('[data-sidebar-top="true"]');
    expect(topSection.textContent).not.toContain('Text-to-Learn');
  });

  it('should NOT show sidebar expander icon when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const expanderBtn = screen.queryByRole('button', { name: /sidebar/i });
    expect(expanderBtn).not.toBeInTheDocument();
  });
});

describe('Sidebar - Hover App Icon to Reveal Expander', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show sidebar expander when hovering app icon', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expanderBtn).toBeInTheDocument();
  });

  it('should position expander overlapping app icon when hovered', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expanderBtn.className).toContain('absolute');
  });

  it('should hide sidebar expander when mouse leaves app icon', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    fireEvent.mouseLeave(appIcon);
    const expanderBtn = screen.queryByRole('button', { name: /expand sidebar/i });
    expect(expanderBtn).not.toBeInTheDocument();
  });

  it('should expand sidebar when expander is clicked during hover', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expanderBtn);
    const sidebar = document.querySelector('aside');
    expect(sidebar.className).toContain('w-[280px]');
  });

  it('should keep sidebar expanded after clicking expander and mouse leaves', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expanderBtn);
    fireEvent.mouseLeave(appIcon);
    const sidebar = document.querySelector('aside');
    expect(sidebar.className).toContain('w-[280px]');
  });
});

describe('Sidebar - Expanded State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show expander on RIGHT when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expandBtn);
    const expanderBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(expanderBtn.className).toContain('ml-auto');
  });

  it('should show nav labels when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expandBtn);
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
  });

  it('should collapse when expander is clicked in expanded state', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expandBtn);
    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    await user.click(collapseBtn);
    const sidebar = document.querySelector('aside');
    expect(sidebar.className).toContain('w-[72px]');
  });
});

describe('Sidebar - Active Section Colors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have white text and icon for active nav item', () => {
    mockLocationPathname = '/';
    render(<Sidebar />, { wrapper });
    const activeLink = document.querySelector('aside nav a[href="/"]');
    expect(activeLink.className).toContain('text-white');
    const iconSpan = activeLink.querySelector('span');
    expect(iconSpan.className).toContain('text-white');
  });

  it('should keep active item white on hover (not faded)', () => {
    mockLocationPathname = '/';
    render(<Sidebar />, { wrapper });
    const activeLink = document.querySelector('aside nav a[href="/"]');
    fireEvent.mouseEnter(activeLink);
    expect(activeLink.className).toContain('text-white');
  });
});

describe('Sidebar - Collapsed Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show tooltips for nav items when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const homeLink = document.querySelector('aside nav a[href="/"]');
    expect(homeLink).toHaveAttribute('title', 'Home');
  });

  it('should hide nav labels when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const activeLink = document.querySelector('aside nav a[href="/"]');
    const labelSpan = activeLink.querySelector('span:last-child');
    expect(labelSpan.className).toContain('max-w-0');
  });
});

describe('Sidebar - User Section (Guest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show guest icon in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    const guestIcon = document.querySelector('[data-guest-icon="true"]');
    expect(guestIcon).toBeInTheDocument();
  });

  it('should show sign in icon in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
  });
});
