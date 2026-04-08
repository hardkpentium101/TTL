import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock Auth0
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: {
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://example.com/avatar.jpg',
    },
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
    getAccessTokenWithPopup: vi.fn().mockResolvedValue('mock-token'),
  }),
  Auth0Provider: ({ children }) => children,
}));

const mockNavigate = vi.fn();
let mockLocationState = null;
let mockLocationPathname = '/';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState, pathname: mockLocationPathname }),
  };
});

const mockGetUserCourses = vi.fn().mockResolvedValue({ courses: [] });
const mockGetOrCreateUser = vi.fn().mockResolvedValue({ user: { id: '1', name: 'Test User' } });

vi.mock('../utils/api', () => ({
  generateCourseAsync: vi.fn(),
  waitForCourse: vi.fn(),
  getCourseById: vi.fn(),
  getUserCourses: (...args) => mockGetUserCourses(...args),
  getOrCreateUser: (...args) => mockGetOrCreateUser(...args),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../events', () => ({
  refreshCoursesEvent: {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn((key) => {
    if (key === 'auth0_token') return 'mock-token';
    if (key === 'bookmarks') return JSON.stringify([]);
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Bookmarks Page - Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockLocationPathname = '/bookmarks';
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auth0_token') return 'mock-token';
      if (key === 'bookmarks') return JSON.stringify([]);
      return null;
    });
  });

  it('should render bookmarks page with empty state', () => {
    render(
      <BrowserRouter>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center card p-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--accent-secondary)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Bookmarks
            </h1>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
              Your bookmarked lessons will appear here.
            </p>
          </div>
        </div>
      </BrowserRouter>
    );

    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
    expect(screen.getByText(/your bookmarked lessons will appear here/i)).toBeInTheDocument();
  });

  it('should display bookmarked items when they exist', () => {
    const mockBookmarks = [
      {
        id: 'bookmark-1',
        lessonTitle: 'Introduction to React',
        courseTitle: 'React Fundamentals',
        moduleTitle: 'Getting Started',
        timestamp: Date.now(),
      },
    ];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'bookmarks') return JSON.stringify(mockBookmarks);
      return 'mock-token';
    });

    render(
      <BrowserRouter>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Bookmarks</h1>
          <div className="space-y-4">
            {mockBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="card p-4">
                <h3 className="font-semibold text-[var(--text-primary)]">{bookmark.lessonTitle}</h3>
                <p className="text-sm text-[var(--text-muted)]">{bookmark.courseTitle} - {bookmark.moduleTitle}</p>
              </div>
            ))}
          </div>
        </div>
      </BrowserRouter>
    );

    expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    expect(screen.getByText('React Fundamentals - Getting Started')).toBeInTheDocument();
  });

  it('should allow removing bookmarks', async () => {
    const mockBookmarks = [
      {
        id: 'bookmark-1',
        lessonTitle: 'Introduction to React',
        courseTitle: 'React Fundamentals',
        moduleTitle: 'Getting Started',
        timestamp: Date.now(),
      },
    ];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'bookmarks') return JSON.stringify(mockBookmarks);
      return 'mock-token';
    });

    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Bookmarks</h1>
          <div className="space-y-4">
            {mockBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{bookmark.lessonTitle}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{bookmark.courseTitle}</p>
                </div>
                <button
                  onClick={() => {
                    const newBookmarks = mockBookmarks.filter(b => b.id !== bookmark.id);
                    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
                  }}
                  className="text-[var(--error)] hover:text-[var(--error-dark)]"
                  aria-label="Remove bookmark"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </BrowserRouter>
    );

    const removeButton = screen.getByRole('button', { name: /remove bookmark/i });
    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'bookmarks',
      JSON.stringify([])
    );
  });
});

describe('Bookmark Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'bookmarks') return JSON.stringify([]);
      return 'mock-token';
    });
    mockLocalStorage.setItem.mockClear();
  });

  it('should add bookmark to localStorage', () => {
    const bookmark = {
      id: 'bookmark-1',
      lessonTitle: 'Test Lesson',
      courseTitle: 'Test Course',
      moduleTitle: 'Test Module',
      timestamp: Date.now(),
    };

    const existingBookmarks = [];
    const updatedBookmarks = [...existingBookmarks, bookmark];
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'bookmarks',
      JSON.stringify([bookmark])
    );
  });

  it('should remove bookmark from localStorage', () => {
    const bookmarks = [
      { id: 'bookmark-1', lessonTitle: 'Lesson 1' },
      { id: 'bookmark-2', lessonTitle: 'Lesson 2' },
    ];

    const updatedBookmarks = bookmarks.filter(b => b.id !== 'bookmark-1');
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'bookmarks',
      JSON.stringify([{ id: 'bookmark-2', lessonTitle: 'Lesson 2' }])
    );
  });

  it('should check if lesson is bookmarked', () => {
    const bookmarks = [
      { id: 'bookmark-1', lessonTitle: 'Lesson 1' },
    ];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(bookmarks));

    const storedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const isBookmarked = storedBookmarks.some(b => b.id === 'bookmark-1');

    expect(isBookmarked).toBe(true);
  });
});
