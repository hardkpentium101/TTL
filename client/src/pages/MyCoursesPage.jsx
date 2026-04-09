import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCourses } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { toggleBookmark, isBookmarked } from '../utils/bookmarks';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkedCourses, setBookmarkedCourses] = useState({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserCourses();
        setCourses(data.courses || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated]);

  const handleCourseClick = async (course) => {
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--border-light)] border-t-[var(--accent-primary)] animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center card p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error-bg)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Error Loading Courses</h2>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center card p-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              My Courses
            </h1>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Your saved courses will appear here. Generate your first course to get started!
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
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent blur-3xl" />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            My Courses
          </h1>
          <p className="text-[var(--text-secondary)]">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => {
            const courseId = course.id || course._id;
            const isBm = bookmarkedCourses[courseId] || false;

            return (
              <div
                key={courseId}
                className="card p-6 hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleCourseClick(course)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-white text-lg font-bold">
                          {(course.title || 'C')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors truncate">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {course.modules_count || course.modules?.length || 0} modules
                          </span>
                          {course.created_at && (
                            <span>
                              {new Date(course.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Bookmark toggle */}
                  <button
                    onClick={() => {
                      const id = courseId;
                      const added = toggleBookmark({
                        id,
                        lessonTitle: course.title,
                        courseTitle: course.title,
                        moduleTitle: 'Course',
                        courseId: id,
                        moduleIndex: 0,
                        lessonIndex: 0,
                      });
                      setBookmarkedCourses(prev => ({ ...prev, [courseId]: added }));
                    }}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border transition-all ${
                      isBm
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--border-light)]'
                        : 'text-[var(--text-muted)] border-[var(--border-light)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]'
                    }`}
                    aria-label={isBm ? `Remove bookmark from ${course.title}` : `Bookmark ${course.title}`}
                  >
                    <svg className="w-5 h-5" fill={isBm ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
