import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookmarks, removeBookmark } from '../utils/bookmarks';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const storedBookmarks = getBookmarks();
        setBookmarks(storedBookmarks);
        setError(null);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
        setError('Could not load bookmarks. Please try again.');
        setBookmarks([]);
      }
    };

    loadBookmarks();

    window.addEventListener('storage', loadBookmarks);
    return () => window.removeEventListener('storage', loadBookmarks);
  }, []);

  const handleRemoveBookmark = (id) => {
    removeBookmark(id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const handleNavigateToLesson = (bookmark) => {
    navigate(`/course/${bookmark.courseId}`, {
      state: {
        moduleIndex: bookmark.moduleIndex,
        lessonIndex: bookmark.lessonIndex,
      },
    });
  };

  if (bookmarks.length === 0 && !error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center card p-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-[var(--bg-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Bookmarks
            </h1>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
              Your bookmarked lessons will appear here.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent blur-3xl" />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Bookmarks
          </h1>
          <p className="text-[var(--text-secondary)]">
            {bookmarks.length} bookmarked lesson{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="card p-4 mb-6 border-l-4 border-l-[var(--error)] bg-[var(--error-bg)]" role="alert">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-[var(--error)] font-medium">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-[var(--accent-primary)] hover:underline"
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4" role="list" aria-label="Bookmarked lessons">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="card p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => handleNavigateToLesson(bookmark)}
                  className="flex-1 min-w-0 text-left group"
                  aria-label={`Open lesson: ${bookmark.lessonTitle}`}
                >
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    {bookmark.lessonTitle}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-1">
                    {bookmark.courseTitle}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Module: {bookmark.moduleTitle}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Bookmarked {new Date(bookmark.timestamp).toLocaleDateString()} at{' '}
                    {new Date(bookmark.timestamp).toLocaleTimeString()}
                  </p>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBookmark(bookmark.id);
                  }}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors flex-shrink-0"
                  aria-label={`Remove bookmark: ${bookmark.lessonTitle}`}
                  title="Remove bookmark"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}