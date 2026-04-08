import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateCourseAsync, getCourseStatus, getCourseResult } from '../utils/api';
import { refreshCoursesEvent } from '../events';

const EXAMPLE_TOPICS = [
  { title: 'Machine Learning', icon: '🧠', desc: 'From neural networks to transformers' },
  { title: 'Quantum Computing', icon: '⚛️', desc: 'Explore the quantum realm' },
  { title: 'Behavioral Economics', icon: '🎭', desc: 'Why we make irrational decisions' },
  { title: 'Ancient Architecture', icon: '🏛️', desc: 'Wonders of structural engineering' },
  { title: 'Creative Writing', icon: '✍️', desc: 'Craft compelling narratives' },
  { title: 'Data Structures', icon: '🗂️', desc: 'Build efficient systems' },
];

const GenerationSteps = [
  { id: 1, text: 'Analyzing your topic', icon: '🔍' },
  { id: 2, text: 'Researching concepts', icon: '📚' },
  { id: 3, text: 'Structuring modules', icon: '🏗️' },
  { id: 4, text: 'Creating lessons', icon: '📝' },
  { id: 5, text: 'Adding resources', icon: '🔗' },
  { id: 6, text: 'Finalizing content', icon: '✨' },
];

const STORAGE_KEY = 'ttl_generation_state';

function saveGenerationState(state) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadGenerationState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const formRef = useRef(null);

  const pollForCompletion = (jobId, savedTopic) => {
    const poll = async () => {
      try {
        const status = await getCourseStatus(jobId);
        const prog = status.progress || 0;
        setProgress(prog);
        setCurrentStep(Math.min(Math.floor(prog / 17), 5));

        saveGenerationState({
          job_id: jobId,
          topic: savedTopic,
          progress: prog,
        });

        if (status.status === 'completed') {
          setProgress(100);
          setCurrentStep(5);

          const result = await getCourseResult(jobId);
          const course = result.data;
          saveGenerationState(null);

          refreshCoursesEvent.dispatchEvent(new Event('refresh'));

          setTimeout(() => {
            const courseData = course.course || course;
            const courseTitle = courseData.title || 'Generated Course';
            navigate(`/course/${encodeURIComponent(courseTitle)}`, {
              state: { course: courseData },
            });
          }, 800);
        } else if (status.status === 'failed') {
          setError(status.message || 'Course generation failed');
          saveGenerationState(null);
          setLoading(false);
        } else {
          setTimeout(poll, 10000);
        }
      } catch (err) {
        console.error('Poll error:', err);
        saveGenerationState(null);
        setLoading(false);
      }
    };

    poll();
  };

  const resumeGeneration = async (jobId, savedTopic) => {
    try {
      const status = await getCourseStatus(jobId);

      if (status.status === 'completed') {
        setProgress(100);
        setCurrentStep(5);

        const result = await getCourseResult(jobId);
        const course = result.data;
        saveGenerationState(null);

        refreshCoursesEvent.dispatchEvent(new Event('refresh'));

        setTimeout(() => {
          const courseData = course.course || course;
          const courseTitle = courseData.title || 'Generated Course';
          navigate(`/course/${encodeURIComponent(courseTitle)}`, {
            state: { course: courseData },
          });
        }, 800);
      } else if (status.status === 'failed') {
        setError(status.message || 'Course generation failed');
        saveGenerationState(null);
        setLoading(false);
      } else {
        setProgress(status.progress || 0);
        setCurrentStep(Math.min(Math.floor((status.progress || 0) / 17), 5));
        pollForCompletion(jobId, savedTopic);
      }
    } catch (err) {
      console.error('Resume generation error:', err);
      saveGenerationState(null);
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Restore generation state on mount
  useEffect(() => {
    const savedState = loadGenerationState();
    if (savedState && savedState.job_id && savedState.topic) {
      setTopic(savedState.topic);
      setLoading(true);
      setProgress(savedState.progress || 0);
      setCurrentStep(Math.min(Math.floor((savedState.progress || 0) / 17), 5));

      resumeGeneration(savedState.job_id, savedState.topic);
    } else {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setProgress(0);
    setCurrentStep(0);

    try {
      const { job_id } = await generateCourseAsync(topic);

      saveGenerationState({
        job_id,
        topic: topic.trim(),
        progress: 0,
      });

      pollForCompletion(job_id, topic.trim());

    } catch (err) {
      console.error('Course generation error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate course');
      setLoading(false);
      saveGenerationState(null);
    }
  };

  const handleTopicSelect = (selectedTopic) => {
    setTopic(selectedTopic);
    if (typeof formRef.current?.scrollIntoView === 'function') {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-[var(--accent-primary)]/20 animate-float" />
        <div className="absolute top-2/3 right-1/4 w-3 h-3 rounded-full bg-[var(--accent-secondary)]/20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-[var(--accent-tertiary)]/20 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-8 md:pt-16 md:pb-12 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-light)] mb-6 md:mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
            </span>
            <span className="text-xs md:text-sm font-medium text-[var(--text-secondary)]">AI-Powered Learning</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 animate-fade-in-up">
            <span className="text-gradient">Learn Anything,</span>
            <br />
            <span className="text-[var(--text-primary)]">Deeply.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg lg:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed animate-fade-in-up stagger-1">
            Describe any topic and I'll create a comprehensive course with lessons,
            quizzes, and resources tailored to your learning journey.
          </p>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="relative px-4 md:px-6 pb-12 md:pb-16" ref={formRef}>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            {/* Card with glow effect */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
              <div className="relative card-elevated p-1 rounded-2xl">
                <div className="bg-[var(--bg-card)] rounded-xl p-1.5 md:p-2">
                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What do you want to learn today?"
                      rows={3}
                      disabled={loading}
                      className="w-full px-4 md:px-6 py-4 md:py-5 text-base md:text-lg bg-transparent border-none resize-none focus:ring-0 placeholder-[var(--text-muted)] text-[var(--text-primary)] disabled:opacity-50"
                      style={{ fontFamily: 'var(--font-display)' }}
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-medium)] to-transparent mx-2 md:mx-4" />

                  {/* Submit row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 md:px-4 py-3">
                    <div className="text-sm text-[var(--text-muted)]">
                      Press <kbd className="px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--border-light)] font-mono text-xs">Enter</kbd> to generate
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !topic.trim()}
                      className="btn btn-primary w-full sm:w-auto px-5 md:px-6 py-3 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <>
                          <span className="relative flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-white/30"></span>
                          </span>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Course
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20 animate-scale-in">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[var(--error)] text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Progress Section */}
            {loading && (
              <div className="mt-6 card p-6 animate-fade-in">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Course Generation</span>
                    <span className="text-sm font-bold text-[var(--accent-primary)]">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {GenerationSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                        index <= currentStep
                          ? 'bg-[var(--accent-primary)]/5 text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      <span className="text-xl w-8 text-center">
                        {index < currentStep ? '✓' : index === currentStep ? step.icon : '○'}
                      </span>
                      <span className={`text-sm font-medium ${index <= currentStep ? '' : ''}`}>
                        {step.text}
                        {index === currentStep && (
                          <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] ml-2 animate-pulse" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm text-[var(--text-muted)] text-center">
                  This usually takes 30-60 seconds. Feel free to explore other topics!
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Example Topics Section */}
      <div className="relative px-4 md:px-6 pb-16 md:pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-8 md:mb-10">
            <div className="ornament mb-3 md:mb-4">
              <span className="decorative-dot" />
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">Explore Topics</h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">Click any topic below to start learning</p>
          </div>

          {/* Topics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMPLE_TOPICS.map((item, index) => (
              <button
                key={item.title}
                onClick={() => handleTopicSelect(item.title)}
                disabled={loading}
                className="group text-left card p-5 hover-lift disabled:opacity-50 disabled:pointer-events-none animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border-light)] to-transparent" />
    </div>
  );
}
