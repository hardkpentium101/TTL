import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import LessonRenderer from '../components/LessonRenderer';
import LessonPDFExporter from '../components/LessonPDFExporter';
import LessonAudioPlayer from '../components/LessonAudioPlayer';
import { getCourseById } from '../utils/api';

const validateCourseData = (course) => {
  if (!course) return false;
  if (!course.modules || !Array.isArray(course.modules)) return false;
  if (course.modules.length === 0) return false;

  for (const module of course.modules) {
    if (!module.lessons || !Array.isArray(module.lessons)) return false;
    if (module.lessons.length === 0) return false;
  }

  return true;
};

function MobileCourseNav({ course, selectedModule, selectedLesson, onModuleSelect, onLessonSelect, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute inset-x-0 bottom-0 top-20 bg-[var(--bg-card)] border-t border-[var(--border-light)] rounded-t-2xl animate-fade-in-up overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center py-3 border-b border-[var(--border-light)]">
          <div className="w-12 h-1.5 rounded-full bg-[var(--text-muted)]" />
        </div>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-light)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">Course Content</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Close navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-4 space-y-4">
          {course.modules?.map((module, moduleIndex) => (
            <div key={module.id || moduleIndex} className="animate-fade-in" style={{ animationDelay: `${moduleIndex * 0.05}s` }}>
              <button
                onClick={() => onModuleSelect(moduleIndex)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedModule === moduleIndex
                    ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                    : 'bg-[var(--bg-tertiary)]/50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    selectedModule === moduleIndex
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                  }`}>
                    {moduleIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm leading-tight ${
                      selectedModule === moduleIndex ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                    }`}>
                      {module.title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {module.lessons?.length || 0} lessons
                    </p>
                  </div>
                </div>
              </button>

              {/* Lessons */}
              {selectedModule === moduleIndex && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-[var(--border-light)] space-y-1 animate-fade-in">
                  {module.lessons?.map((lesson, lessonIndex) => (
                    <button
                      key={lesson.id || lessonIndex}
                      onClick={() => {
                        onLessonSelect(lessonIndex);
                        onClose();
                      }}
                      className={`w-full text-left p-2 rounded-md text-sm transition-all duration-200 ${
                        selectedLesson === lessonIndex
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          selectedLesson === lessonIndex
                            ? 'bg-[var(--accent-primary)]'
                            : 'bg-[var(--text-muted)]'
                        }`} />
                        <span className="truncate">{lesson.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const courseFromState = location.state?.course;

  const [course, setCourse] = useState(courseFromState);
  const [loading, setLoading] = useState(!courseFromState);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (courseFromState) {
      if (!validateCourseData(courseFromState)) {
        setError('Invalid course data structure');
        setLoading(false);
        return;
      }
      setCourse(courseFromState);
      setLoading(false);
      return;
    }

    if (courseId && courseId !== 'undefined') {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const data = await getCourseById(courseId);
          
          if (!data.course || !validateCourseData(data.course)) {
            setError('Invalid course data received from server');
            return;
          }
          
          setCourse(data.course);
        } catch (err) {
          console.error('Failed to fetch course:', err);
          setError(err.response?.data?.detail || err.message || 'Failed to load course');
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    } else if (!courseId && !courseFromState) {
      setError('No course selected');
      setLoading(false);
    }
  }, [courseId, courseFromState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--border-light)] border-t-[var(--accent-primary)] animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center card p-8 max-w-md mx-4 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error-bg)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Course Not Found</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || 'Please generate a course first to get started.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentModule = course.modules?.[selectedModule];
  const currentLesson = currentModule?.lessons?.[selectedLesson];
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const currentLessonNumber = course.modules?.slice(0, selectedModule).reduce((acc, m) => acc + (m.lessons?.length || 0), 0) + selectedLesson + 1 || 1;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative bg-gradient-warm border-b border-[var(--border-light)]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--accent-primary)]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-[var(--accent-secondary)]/10 blur-3xl" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 py-8 pt-24">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 animate-fade-in">
            {/* Mobile course navigation button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-light)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              aria-label="Open course navigation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Contents</span>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="hidden lg:flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-sm text-[var(--text-secondary)] truncate max-w-[200px]">{course.title}</span>
          </div>

          {/* Title Section */}
          <div className="animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {course.title}
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mb-6 leading-relaxed">
              {course.description}
            </p>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
              {course.metadata?.level && (
                <span className="badge badge-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {course.metadata.level}
                </span>
              )}
              {course.metadata?.estimated_duration && (
                <span className="badge">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.metadata.estimated_duration}
                </span>
              )}
              <span className="badge">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {totalLessons} lessons
              </span>
              <span className="badge">
                {course.modules?.length || 0} modules
              </span>
            </div>

            {/* Prerequisites */}
            {course.metadata?.prerequisites?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--text-muted)]">Prerequisites:</span>
                {course.metadata.prerequisites.map((prereq, index) => (
                  <span key={index} className="text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                    {prereq}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Modules Sidebar - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <div className="card p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Course Content
                </h3>
                
                <div className="space-y-3">
                  {course.modules?.map((module, moduleIndex) => (
                    <div key={module.id || moduleIndex} className="animate-fade-in-up" style={{ animationDelay: `${moduleIndex * 0.1}s` }}>
                      <button
                        onClick={() => {
                          setSelectedModule(moduleIndex);
                          setSelectedLesson(0);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          selectedModule === moduleIndex
                            ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                            : 'bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                            selectedModule === moduleIndex
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                          }`}>
                            {moduleIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm leading-tight ${
                              selectedModule === moduleIndex ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                            }`}>
                              {module.title}
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {module.lessons?.length || 0} lessons
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Lessons - expanded when selected */}
                      {selectedModule === moduleIndex && (
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-[var(--border-light)] space-y-1 animate-fade-in">
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <button
                              key={lesson.id || lessonIndex}
                              onClick={() => setSelectedLesson(lessonIndex)}
                              className={`w-full text-left p-2 rounded-md text-sm transition-all duration-200 ${
                                selectedLesson === lessonIndex
                                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  selectedLesson === lessonIndex
                                    ? 'bg-[var(--accent-primary)]'
                                    : 'bg-[var(--text-muted)]'
                                }`} />
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Lesson Content */}
          <main className="flex-1 min-w-0">
            {currentLesson && (
              <div className="animate-fade-in-up">
                {/* Lesson Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="badge">
                      Module {selectedModule + 1}
                    </span>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="badge">
                      Lesson {currentLessonNumber} of {totalLessons}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    {currentLesson.title}
                  </h2>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    <LessonPDFExporter
                      lesson={currentLesson}
                      courseTitle={course.title}
                      moduleName={currentModule.title}
                    />
                    <button
                      onClick={() => {
                        const nextLessonIndex = selectedLesson + 1;
                        if (nextLessonIndex < (currentModule.lessons?.length || 0)) {
                          setSelectedLesson(nextLessonIndex);
                        } else if (selectedModule < (course.modules?.length || 0) - 1) {
                          setSelectedModule(selectedModule + 1);
                          setSelectedLesson(0);
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="btn btn-secondary text-sm"
                    >
                      Next Lesson
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Learning Objectives */}
                {currentLesson.objectives && currentLesson.objectives.length > 0 && (
                  <div className="card p-6 mb-6 border-l-4 border-l-[var(--success)]">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Learning Objectives
                    </h3>
                    <ul className="space-y-2">
                      {currentLesson.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3 text-[var(--text-secondary)]">
                          <span className="w-5 h-5 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Topics */}
                {currentLesson.key_topics && currentLesson.key_topics.length > 0 && (
                  <div className="card p-6 mb-6 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Key Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentLesson.key_topics.map((topic, index) => (
                        <span key={index} className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-default">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lesson Content */}
                <div className="card p-6 md:p-8 mb-6">
                  <LessonRenderer content={currentLesson.content} />
                </div>

                {/* Audio Player */}
                <div className="card p-6 mb-6">
                  <LessonAudioPlayer lesson={currentLesson} />
                </div>

                {/* Resources */}
                {currentLesson.resources && currentLesson.resources.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Additional Resources
                    </h3>
                    <ul className="space-y-2">
                      {currentLesson.resources.map((resource, index) => (
                        <li key={index}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                            <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors flex-1">
                              {resource.title}
                            </span>
                            <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t border-[var(--border-light)]">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        if (selectedLesson > 0) {
                          setSelectedLesson(selectedLesson - 1);
                        } else if (selectedModule > 0) {
                          setSelectedModule(selectedModule - 1);
                          setSelectedLesson((course.modules?.[selectedModule - 1]?.lessons?.length || 1) - 1);
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={selectedModule === 0 && selectedLesson === 0}
                      className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    
                    <span className="text-sm text-[var(--text-muted)]">
                      {currentLessonNumber} / {totalLessons}
                    </span>
                    
                    <button
                      onClick={() => {
                        const nextLessonIndex = selectedLesson + 1;
                        if (nextLessonIndex < (currentModule.lessons?.length || 0)) {
                          setSelectedLesson(nextLessonIndex);
                        } else if (selectedModule < (course.modules?.length || 0) - 1) {
                          setSelectedModule(selectedModule + 1);
                          setSelectedLesson(0);
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={selectedModule === (course.modules?.length || 0) - 1 && selectedLesson === (currentModule.lessons?.length || 0) - 1}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Lesson
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Course Navigation */}
      <MobileCourseNav
        course={course}
        selectedModule={selectedModule}
        selectedLesson={selectedLesson}
        onModuleSelect={setSelectedModule}
        onLessonSelect={setSelectedLesson}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </div>
  );
}
