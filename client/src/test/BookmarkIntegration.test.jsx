import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CoursePage from '../pages/CoursePage';

// Mock modules
vi.mock('../utils/api', () => ({
  getCourseById: vi.fn(),
}));

vi.mock('../utils/bookmarks', () => ({
  toggleBookmark: vi.fn((data) => {
    // Simulate toggle: if bookmark exists in mock storage, remove it; otherwise add
    const bookmarks = JSON.parse(localStorage.getItem('text_to_learn_bookmarks') || '[]');
    const exists = bookmarks.some(b => b.id === data.id);
    if (exists) {
      const filtered = bookmarks.filter(b => b.id !== data.id);
      localStorage.setItem('text_to_learn_bookmarks', JSON.stringify(filtered));
      return false;
    } else {
      const newBookmarks = [{ ...data, timestamp: Date.now() }, ...bookmarks];
      localStorage.setItem('text_to_learn_bookmarks', JSON.stringify(newBookmarks));
      return true;
    }
  }),
  isBookmarked: vi.fn((id) => {
    const bookmarks = JSON.parse(localStorage.getItem('text_to_learn_bookmarks') || '[]');
    return bookmarks.some(b => b.id === id);
  }),
}));

vi.mock('../components/LessonRenderer', () => ({
  default: () => <div data-testid="lesson-content">Lesson Content</div>,
}));

vi.mock('../components/LessonPDFExporter', () => ({
  default: () => <button data-testid="pdf-export">Download PDF</button>,
}));

vi.mock('../components/LessonAudioPlayer', () => ({
  default: () => <div data-testid="audio-player">Audio Player</div>,
}));

import { getCourseById } from '../utils/api';
import { toggleBookmark, isBookmarked } from '../utils/bookmarks';

const mockCourse = {
  _id: 'course-123',
  id: 'course-123',
  title: 'Introduction to JavaScript',
  description: 'Learn the fundamentals of JavaScript',
  modules: [
    {
      id: 'mod-1',
      title: 'Getting Started',
      lessons: [
        {
          id: 'lesson-1',
          title: 'What is JavaScript?',
          objectives: ['Understand JS basics'],
          content: [
            { type: 'heading', text: 'Introduction' },
            { type: 'paragraph', text: 'JavaScript is a programming language.' },
          ],
        },
        {
          id: 'lesson-2',
          title: 'Variables and Types',
          objectives: ['Learn about variables'],
          content: [
            { type: 'heading', text: 'Variables' },
            { type: 'paragraph', text: 'Variables store data.' },
          ],
        },
      ],
    },
    {
      id: 'mod-2',
      title: 'Functions',
      lessons: [
        {
          id: 'lesson-3',
          title: 'Function Basics',
          objectives: ['Write functions'],
          content: [
            { type: 'paragraph', text: 'Functions are reusable code blocks.' },
          ],
        },
      ],
    },
  ],
};

const renderCoursePage = (courseState = null, courseId = 'course-123') => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/course/${courseId}`, state: courseState ? { course: courseState } : undefined }]}>
      <Routes>
        <Route path="/course/:courseId" element={<CoursePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Bookmark Integration - CoursePage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    getCourseById.mockResolvedValue({ course: mockCourse });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render bookmark button on lesson page', async () => {
    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark this lesson/i })).toBeInTheDocument();
    });
  });

  it('should show "Bookmark" when lesson is not bookmarked', async () => {
    isBookmarked.mockReturnValue(false);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      const bookmarkBtn = screen.getByRole('button', { name: /bookmark this lesson/i });
      expect(bookmarkBtn).toHaveTextContent('Bookmark');
      expect(bookmarkBtn).not.toHaveTextContent('Bookmarked');
    });
  });

  it('should show "Bookmarked" when lesson is already bookmarked', async () => {
    isBookmarked.mockReturnValue(true);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      const bookmarkBtn = screen.getByRole('button', { name: /remove bookmark/i });
      expect(bookmarkBtn).toHaveTextContent('Bookmarked');
    });
  });

  it('should add bookmark when clicking bookmark button', async () => {
    isBookmarked.mockReturnValue(false);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark this lesson/i })).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByRole('button', { name: /bookmark this lesson/i });

    await act(async () => {
      fireEvent.click(bookmarkBtn);
    });

    expect(toggleBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'course-123-0-0',
        lessonTitle: 'What is JavaScript?',
        courseTitle: 'Introduction to JavaScript',
        moduleTitle: 'Getting Started',
        courseId: 'course-123',
        moduleIndex: 0,
        lessonIndex: 0,
      })
    );
  });

  it('should remove bookmark when clicking bookmark button on bookmarked lesson', async () => {
    isBookmarked.mockReturnValue(true);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove bookmark/i })).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByRole('button', { name: /remove bookmark/i });

    await act(async () => {
      fireEvent.click(bookmarkBtn);
    });

    expect(toggleBookmark).toHaveBeenCalled();
  });

  it('should update bookmark status when navigating to next lesson', async () => {
    isBookmarked.mockReturnValue(false);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /what is javascript\?/i })).toBeInTheDocument();
    });

    // Bookmark the first lesson
    const bookmarkBtn = screen.getByRole('button', { name: /bookmark this lesson/i });
    await act(async () => {
      fireEvent.click(bookmarkBtn);
    });

    expect(toggleBookmark).toHaveBeenCalledTimes(1);

    // Navigate to next lesson (click the first "Next Lesson" button in action bar)
    const nextBtns = screen.getAllByText(/next lesson/i);
    await act(async () => {
      fireEvent.click(nextBtns[0]);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /variables and types/i })).toBeInTheDocument();
    });

    // Bookmark status should update for the new lesson
    expect(isBookmarked).toHaveBeenCalled();
  });

  it('should generate correct bookmark ID with course, module, and lesson indices', async () => {
    isBookmarked.mockReturnValue(false);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark this lesson/i })).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByRole('button', { name: /bookmark this lesson/i });

    await act(async () => {
      fireEvent.click(bookmarkBtn);
    });

    // Verify the bookmark ID format: courseId-moduleIndex-lessonIndex
    expect(toggleBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'course-123-0-0',
      })
    );
  });

  it('should persist bookmarks in localStorage', async () => {
    isBookmarked.mockReturnValue(false);

    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark this lesson/i })).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByRole('button', { name: /bookmark this lesson/i });

    await act(async () => {
      fireEvent.click(bookmarkBtn);
    });

    // Verify localStorage was updated
    const storedBookmarks = JSON.parse(localStorage.getItem('text_to_learn_bookmarks') || '[]');
    expect(storedBookmarks).toHaveLength(1);
    expect(storedBookmarks[0]).toMatchObject({
      lessonTitle: 'What is JavaScript?',
      courseTitle: 'Introduction to JavaScript',
      courseId: 'course-123',
    });
  });

  it('should have bookmark button in the action bar alongside PDF export', async () => {
    await act(async () => {
      renderCoursePage(mockCourse, 'course-123');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bookmark this lesson/i })).toBeInTheDocument();
      expect(screen.getByTestId('pdf-export')).toBeInTheDocument();
    });

    // Both buttons should be visible
    const bookmarkBtn = screen.getByRole('button', { name: /bookmark this lesson/i });
    const pdfBtn = screen.getByTestId('pdf-export');
    
    expect(bookmarkBtn).toBeVisible();
    expect(pdfBtn).toBeVisible();
  });
});
