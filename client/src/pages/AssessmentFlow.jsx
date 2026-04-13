import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuiz, evaluateQuiz, generateCourseAsync, getCourseResult } from '../utils/api';
import { refreshCoursesEvent } from '../events';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_DESCRIPTIONS = {
  Beginner: "I'm new to this topic and want to learn the basics",
  Intermediate: "I have some experience and want to deepen my understanding",
  Advanced: "I'm experienced and want to master advanced concepts",
};

// Phase 1: Topic Intake Component
function TopicIntake({ onNext }) {
  const [topic, setTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    if (!selectedLevel) {
      setError('Please select your level');
      return;
    }
    onNext({ topic: topic.trim(), level: selectedLevel });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-8 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-light)] mb-6 md:mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
            </span>
            <span className="text-xs md:text-sm font-medium text-[var(--text-secondary)]">Adaptive Learning Assessment</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 animate-fade-in-up">
            <span className="text-gradient">Discover Your</span>
            <br />
            <span className="text-[var(--text-primary)]">Knowledge Level</span>
          </h1>

          <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed animate-fade-in-up stagger-1">
            Tell us what you want to learn and your current comfort level. 
            We'll assess your knowledge and create a personalized learning path.
          </p>
        </div>
      </div>

      {/* Assessment Form */}
      <div className="relative px-4 md:px-6 pb-12" ref={formRef}>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
              <div className="relative card-elevated p-1 rounded-2xl">
                <div className="bg-[var(--bg-card)] rounded-xl p-6 md:p-8">
                  {/* Topic Input */}
                  <div className="mb-6">
                    <label htmlFor="topic" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      What do you want to learn?
                    </label>
                    <input
                      id="topic"
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Python Programming, Machine Learning, Data Structures"
                      className="w-full px-4 py-3 text-base bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    />
                  </div>

                  {/* Level Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                      Select your current level
                    </label>
                    <div className="space-y-3">
                      {LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSelectedLevel(level)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                            selectedLevel === level
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                              : 'border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-[var(--border-medium)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">{level}</div>
                              <div className="text-sm text-[var(--text-secondary)] mt-1">
                                {LEVEL_DESCRIPTIONS[level]}
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedLevel === level
                                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                                  : 'border-[var(--border-medium)]'
                              }`}
                            >
                              {selectedLevel === level && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/20 animate-scale-in">
                      <p className="text-[var(--error)] text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary w-full px-6 py-3 text-base"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Assessment
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Phase 2: Quiz Component
function AdaptiveQuiz({ topic, level, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizLevel, setQuizLevel] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadQuiz = async () => {
      try {
        console.log('[Quiz] Starting quiz generation for:', topic, level);
        setLoading(true);
        setError('');
        const quizData = await generateQuiz(topic, level, controller.signal);
        console.log('[Quiz] Quiz response received:', quizData);
        setQuestions(quizData.questions);
        setQuizLevel(quizData.quiz_level);
        setUserAnswers(new Array(quizData.questions.length).fill(null));
        console.log('[Quiz] Quiz loaded with', quizData.questions.length, 'questions');
      } catch (err) {
        if (err.name === 'CanceledError') {
          console.log('[Quiz] Request cancelled (duplicate mount)');
          return;
        }
        console.error('[Quiz] Quiz generation error:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to generate quiz');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadQuiz();

    return () => {
      controller.abort();
    };
  }, [topic, level]);

  const handleAnswerSelect = (answerIndex) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
      setShowExplanation(false);
    } else {
      // Quiz completed
      onComplete(questions, userAnswers, level);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
      setShowExplanation(false);
    }
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--accent-primary)] border-t-transparent mb-4"></div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Generating Your Quiz</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            Creating 5 adaptive questions about <strong>{topic}</strong>...
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
            This takes 1-2 minutes. Please wait.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-[var(--error)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Quiz Generation Failed</h2>
          <p className="text-[var(--text-secondary)] mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = userAnswers[currentQuestion] !== null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-bold text-[var(--accent-primary)]">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500 ease-out"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Quiz Level: {quizLevel}
          </p>
        </div>

        {/* Question Card */}
        <div className="card-elevated p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-[var(--text-primary)]">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
              const isSelected = userAnswers[currentQuestion] === index;
              const isCorrect = index === question.answer;
              const showResult = showExplanation;

              let optionClasses = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200';
              
              if (showResult) {
                if (isCorrect) {
                  optionClasses += ' border-[var(--success)] bg-[var(--success)]/10';
                } else if (isSelected && !isCorrect) {
                  optionClasses += ' border-[var(--error)] bg-[var(--error)]/10';
                } else {
                  optionClasses += ' border-[var(--border-light)] opacity-50';
                }
              } else if (isSelected) {
                optionClasses += ' border-[var(--accent-primary)] bg-[var(--accent-primary)]/10';
              } else {
                optionClasses += ' border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-[var(--border-medium)]';
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={optionClasses}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                        showResult
                          ? isCorrect
                            ? 'bg-[var(--success)] text-white'
                            : isSelected
                            ? 'bg-[var(--error)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          : isSelected
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-[var(--text-primary)]">{option}</span>
                    {showResult && isCorrect && (
                      <svg className="w-5 h-5 text-[var(--success)] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] mb-6 animate-fade-in">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Explanation:</h3>
              <p className="text-[var(--text-secondary)]">{question.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {!showExplanation && isAnswered && (
                <button
                  type="button"
                  onClick={handleShowExplanation}
                  className="btn btn-secondary"
                >
                  Show Explanation
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!isAnswered}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestion < questions.length - 1 ? 'Next' : 'Finish Quiz'}
              </button>
            </div>
          </div>
        </div>

        {/* Question Navigation Dots */}
        <div className="flex items-center justify-center gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCurrentQuestion(index);
                setSelectedAnswer(userAnswers[index]);
                setShowExplanation(false);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentQuestion
                  ? 'bg-[var(--accent-primary)] scale-125'
                  : userAnswers[index] !== null
                  ? 'bg-[var(--accent-secondary)]'
                  : 'bg-[var(--border-light)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Phase 3: Score & Assessment Results
function AssessmentResults({ score, correct, total, assessedLevel, userLevel, topic, onGenerateCourse, onRetakeQuiz }) {
  const scorePercentage = score;
  
  const getMessage = () => {
    if (scorePercentage >= 80) {
      return {
        emoji: '🎉',
        title: 'Excellent Performance!',
        description: 'You have a strong understanding of this topic.',
      };
    } else if (scorePercentage >= 60) {
      return {
        emoji: '👍',
        title: 'Good Job!',
        description: 'You have a solid foundation with room to grow.',
      };
    } else if (scorePercentage >= 40) {
      return {
        emoji: '💪',
        title: 'Keep Learning!',
        description: "You're on the right track. Let's strengthen your basics.",
      };
    } else {
      return {
        emoji: '📚',
        title: 'Let\'s Start from the Basics',
        description: "We'll build your knowledge step by step.",
      };
    }
  };

  const message = getMessage();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Results Card */}
        <div className="card-elevated p-8 md:p-12 mb-8">
          {/* Score Circle */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <svg className="w-40 h-40 md:w-48 md:h-48" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    scorePercentage >= 80
                      ? 'var(--success)'
                      : scorePercentage >= 60
                      ? 'var(--accent-primary)'
                      : scorePercentage >= 40
                      ? 'var(--warning)'
                      : 'var(--error)'
                  }
                  strokeWidth="8"
                  strokeDasharray={`${(scorePercentage / 100) * 283} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]">
                  {scorePercentage}%
                </span>
                <span className="text-sm text-[var(--text-secondary)] mt-1">
                  {correct}/{total} Correct
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="text-5xl mb-4">{message.emoji}</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--text-primary)]">
              {message.title}
            </h2>
            <p className="text-[var(--text-secondary)]">{message.description}</p>
          </div>

          {/* Level Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)]">
              <div className="text-sm text-[var(--text-muted)] mb-1">Self-Assessed Level</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{userLevel}</div>
            </div>
            <div className="p-4 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
              <div className="text-sm text-[var(--text-muted)] mb-1">Assessed Level</div>
              <div className="text-lg font-semibold text-[var(--accent-primary)]">{assessedLevel}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onGenerateCourse}
              className="btn btn-primary w-full px-6 py-3 text-base"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate My Personalized Course
            </button>
            <button
              onClick={onRetakeQuiz}
              className="btn btn-secondary w-full px-6 py-3 text-base"
            >
              Retake Quiz
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">What happens next?</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Based on your assessed level of <strong>{assessedLevel}</strong>, we'll generate a comprehensive course 
            tailored to your knowledge level. The course will include lessons, examples, quizzes, and resources 
            to help you master <strong>{topic}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Course Generation Loading State
function CourseGeneration({ topic, level }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const steps = [
    { id: 1, text: 'Analyzing your assessment', icon: '📊' },
    { id: 2, text: 'Researching concepts', icon: '🔍' },
    { id: 3, text: 'Structuring modules', icon: '🏗️' },
    { id: 4, text: 'Creating lessons', icon: '📝' },
    { id: 5, text: 'Adding resources', icon: '🔗' },
    { id: 6, text: 'Finalizing content', icon: '✨' },
  ];

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let eventSource = null;
    let cancelled = false;

    const startGeneration = async () => {
      try {
        const { job_id } = await generateCourseAsync(topic, level);
        if (cancelled) return;

        // Connect to SSE stream for real-time progress
        eventSource = new EventSource(`${API_BASE_URL}/api/course-status-stream/${job_id}`);

        eventSource.onmessage = (event) => {
          if (cancelled) return;
          const status = JSON.parse(event.data);
          const prog = status.progress || 0;
          setProgress(prog);
          setCurrentStep(Math.min(Math.floor(prog / 17), 5));
        };

        eventSource.addEventListener('done', (event) => {
          if (cancelled) return;
          const doneData = JSON.parse(event.data);
          eventSource.close();

          if (doneData.status === 'completed') {
            setProgress(100);
            setCurrentStep(5);

            // Fetch the completed course
            getCourseResult(job_id).then((result) => {
              if (cancelled) return;
              const course = result.data;
              refreshCoursesEvent.dispatchEvent(new Event('refresh'));

              setTimeout(() => {
                const courseData = course.course || course;
                const courseTitle = courseData.title || 'Generated Course';
                navigate(`/course/${encodeURIComponent(courseTitle)}`, {
                  state: { course: courseData },
                });
              }, 800);
            }).catch((err) => {
              console.error('Failed to fetch course result:', err);
              if (!cancelled) setError('Course generated but failed to load it.');
            });
          } else if (doneData.status === 'failed') {
            setError('Course generation failed');
          }
        });

        eventSource.onerror = (err) => {
          if (cancelled) return;
          console.error('SSE connection error:', err);
          eventSource.close();

          // Fallback: try to get status via polling
          import('./../utils/api').then(({ getCourseStatus }) => {
            const poll = async () => {
              if (cancelled) return;
              try {
                const status = await getCourseStatus(job_id);
                const prog = status.progress || 0;
                setProgress(prog);
                setCurrentStep(Math.min(Math.floor(prog / 17), 5));

                if (status.status === 'completed') {
                  setProgress(100);
                  setCurrentStep(5);
                  const result = await getCourseResult(job_id);
                  const course = result.data;
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
                } else {
                  setTimeout(poll, 5000);
                }
              } catch (pollErr) {
                console.error('Poll fallback error:', pollErr);
                if (!cancelled) setError('Failed to track course generation');
              }
            };
            poll();
          });
        };
      } catch (err) {
        console.error('Course generation error:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to generate course');
      }
    };

    startGeneration();

    return () => {
      cancelled = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [topic, level, navigate]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="card-elevated p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">
            Generating Your Personalized Course
          </h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Progress</span>
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
          <div className="space-y-3 mb-6">
            {steps.map((step, index) => (
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
                <span className="text-sm font-medium">
                  {step.text}
                  {index === currentStep && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] ml-2 animate-pulse" />
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/20">
              <p className="text-[var(--error)] text-sm">{error}</p>
            </div>
          )}

          <p className="text-sm text-[var(--text-muted)] text-center">
            This usually takes 30-60 seconds. Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Assessment Flow Component
export default function AssessmentFlow() {
  const [phase, setPhase] = useState('topic'); // 'topic', 'quiz', 'results', 'generating'
  const [topicIntake, setTopicIntake] = useState(null);
  const [quizResults, setQuizResults] = useState(null);

  const handleTopicSubmit = (data) => {
    setTopicIntake(data);
    setPhase('quiz');
  };

  const handleQuizComplete = async (questions, userAnswers, level) => {
    try {
      const results = await evaluateQuiz(questions, userAnswers, level);
      setQuizResults({ ...results, topic: topicIntake.topic });
      setPhase('results');
    } catch (err) {
      console.error('Quiz evaluation error:', err);
      // Fallback to client-side evaluation
      const correct = questions.reduce(
        (count, q, i) => count + (userAnswers[i] === q.answer ? 1 : 0),
        0
      );
      const score = Math.round((correct / questions.length) * 100);
      
      const levels = ['Beginner', 'Intermediate', 'Advanced'];
      const userLevelIdx = levels.indexOf(level);
      let assessedIdx;
      if (score <= 40) assessedIdx = Math.max(0, userLevelIdx - 1);
      else if (score <= 70) assessedIdx = userLevelIdx;
      else assessedIdx = Math.min(2, userLevelIdx + 1);

      setQuizResults({
        score,
        correct,
        total: questions.length,
        assessed_level: levels[assessedIdx],
        user_level: level,
        topic: topicIntake.topic,
      });
      setPhase('results');
    }
  };

  const handleGenerateCourse = () => {
    setPhase('generating');
  };

  const handleRetakeQuiz = () => {
    setPhase('quiz');
    setQuizResults(null);
  };

  switch (phase) {
    case 'topic':
      return <TopicIntake onNext={handleTopicSubmit} />;
    case 'quiz':
      return (
        <AdaptiveQuiz
          topic={topicIntake.topic}
          level={topicIntake.level}
          onComplete={handleQuizComplete}
        />
      );
    case 'results':
      return (
        <AssessmentResults
          score={quizResults.score}
          correct={quizResults.correct}
          total={quizResults.total}
          assessedLevel={quizResults.assessed_level}
          userLevel={quizResults.user_level}
          topic={quizResults.topic}
          onGenerateCourse={handleGenerateCourse}
          onRetakeQuiz={handleRetakeQuiz}
        />
      );
    case 'generating':
      return (
        <CourseGeneration
          topic={quizResults.topic}
          level={quizResults.assessed_level}
        />
      );
    default:
      return <TopicIntake onNext={handleTopicSubmit} />;
  }
}
