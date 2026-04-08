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

  it('should show app icon when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    expect(appIcon).toBeInTheDocument();
    expect(appIcon.className).toContain('bg-gradient-to-br');
  });

  it('should show expander button at the opposite end (right) when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expanderBtn).toBeInTheDocument();
  });

  it('should have app icon on the right and expander on the left when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const topSection = document.querySelector('[data-sidebar-top="true"]');
    const appIcon = document.querySelector('[data-app-icon="true"]');
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });

    // Both should be visible
    expect(appIcon).toBeInTheDocument();
    expect(expanderBtn).toBeInTheDocument();
    // Parent container should use justify-between (opposite ends)
    expect(topSection.className).toContain('justify-between');
  });

  it('should not have a top separator bar', () => {
    render(<Sidebar />, { wrapper });
    const topSection = document.querySelector('[data-sidebar-top="true"]');
    expect(topSection).toBeInTheDocument();
    expect(topSection.className).not.toContain('border-b');
  });
});

describe('Sidebar - Hover App Icon Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should expand sidebar when app icon is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    await user.click(appIcon);

    const sidebar = document.querySelector('aside');
    expect(sidebar.className).toContain('w-[280px]');
  });

  it('should show app icon with text label when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    await user.click(appIcon);

    expect(screen.getByText('Text-to-Learn')).toBeInTheDocument();
  });
});

describe('Sidebar - Expanded State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should show nav labels when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    await user.click(appIcon);

    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should show expander button with collapse label when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    await user.click(appIcon);

    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(collapseBtn).toBeInTheDocument();
  });

  it('should collapse when expander is clicked in expanded state', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    await user.click(appIcon);

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

  it('should have proper hover color for inactive items', () => {
    mockLocationPathname = '/my-courses';
    render(<Sidebar />, { wrapper });

    const homeLink = document.querySelector('aside nav a[href="/"]');
    fireEvent.mouseEnter(homeLink);

    const iconSpan = homeLink.querySelector('span');
    expect(iconSpan.className).toContain('group-hover:text-[var(--text-primary)]');
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

  it('should have correct href for nav items in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    const homeLink = document.querySelector('aside nav a[href="/"]');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/');
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

  it('should show sign in icon (not button text) in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    // Sign in should be visible as an icon-only button
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
  });

  it('should show guest icon, "Guest" text, and sign in button when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    await user.click(appIcon);

    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('Sidebar - User Section Overflow Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationPathname = '/';
  });

  it('should have min-h on user section rows to prevent icon compression', () => {
    render(<Sidebar />, { wrapper });
    const userRow = document.querySelector('[data-user-section="true"] [class*="min-h"]');
    // Should exist to prevent compression
    expect(userRow).toBeInTheDocument();
  });

  it('should have fixed width/height on guest icon to prevent compression', () => {
    render(<Sidebar />, { wrapper });
    const guestIcon = document.querySelector('[data-guest-icon="true"]');
    expect(guestIcon.style.minWidth).toBe('40px');
    expect(guestIcon.style.maxWidth).toBe('40px');
  });
});
