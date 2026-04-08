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

  it('should show app icon on the LEFT when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    expect(appIcon).toBeInTheDocument();
    // App icon should be on the left (not order-2)
    expect(appIcon.className).not.toContain('order-2');
  });

  it('should NOT show app name in sidebar', () => {
    render(<Sidebar />, { wrapper });
    // Text-to-Learn should not be in sidebar (it's in the top header)
    const sidebar = document.querySelector('aside');
    const appName = sidebar.querySelector('[data-sidebar-top="true"]');
    // The top section should NOT contain "Text-to-Learn" text
    expect(appName.textContent).not.toContain('Text-to-Learn');
  });

  it('should NOT show sidebar expander icon when collapsed', () => {
    render(<Sidebar />, { wrapper });
    const expanderBtn = screen.queryByRole('button', { name: /sidebar/i });
    expect(expanderBtn).not.toBeInTheDocument();
  });

  it('should not have a top separator bar', () => {
    render(<Sidebar />, { wrapper });
    const topSection = document.querySelector('[data-sidebar-top="true"]');
    expect(topSection).toBeInTheDocument();
    expect(topSection.className).not.toContain('border-b');
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

  it('should position expander overlapping app icon completely when hovered', () => {
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);

    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    // Expander should be at the same position as app icon (overlapping)
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

  it('should show app icon on LEFT and expander on RIGHT when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expandBtn);

    // After expanding, app icon should be visible again
    const appIconAfter = document.querySelector('[data-app-icon="true"]');
    expect(appIconAfter).toBeInTheDocument();
    expect(appIconAfter.className).toContain('opacity-100');

    // Expander should be on the right (ml-auto class)
    const expanderBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(expanderBtn.className).toContain('ml-auto');
  });

  it('should show nav labels when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expanderBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expanderBtn);

    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
  });

  it('should show collapse label on expander when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expandBtn);

    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(collapseBtn).toBeInTheDocument();
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

  it('should show sign in icon in collapsed state', () => {
    render(<Sidebar />, { wrapper });
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
  });

  it('should show guest icon, "Guest" text, and sign in button when expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });
    const appIcon = document.querySelector('[data-app-icon="true"]');
    fireEvent.mouseEnter(appIcon);
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i });
    await user.click(expandBtn);

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
    expect(userRow).toBeInTheDocument();
  });

  it('should have fixed width/height on guest icon to prevent compression', () => {
    render(<Sidebar />, { wrapper });
    const guestIcon = document.querySelector('[data-guest-icon="true"]');
    expect(guestIcon.style.minWidth).toBe('40px');
    expect(guestIcon.style.maxWidth).toBe('40px');
  });
});
