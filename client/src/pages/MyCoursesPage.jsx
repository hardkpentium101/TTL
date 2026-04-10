import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCourses } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { refreshCoursesEvent } from '../events';

const MyCoursesPage = function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
        setError('');
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, refreshTrigger]);

  // Listen for course refresh events (e.g., after token refresh or new course generation)
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    refreshCoursesEvent.addEventListener('refresh', handleRefresh);
    return () => refreshCoursesEvent.removeEventListener('refresh', handleRefresh);
  }, []);

  const handleCourseClick = useCallback(async (course) => {
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
  }, [navigate]);

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
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          My Courses
        </h1>
        <p className="text-[var(--text-secondary)]">
          {courses.length} course{courses.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <button
            key={course.id || course._id}
            onClick={() => handleCourseClick(course)}
            className="card p-6 text-left hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        ))}
      </div>
    </div>
  );
};

export default MyCoursesPage;
