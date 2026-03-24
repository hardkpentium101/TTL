import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateCourseAsync, waitForCourse } from '../utils/api';

export default function PromptForm() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setProgress(0);
    setStatusMessage('Starting course generation...');

    try {
      // Start async job
      const { job_id } = await generateCourseAsync(topic);
      
      // Poll for completion with progress updates
      const course = await waitForCourse(
        job_id,
        (status) => {
          setProgress(status.progress || 0);
          setStatusMessage(status.message || 'Generating...');
        },
        20000  // Poll every 20 seconds
      );
      
      setProgress(100);
      setStatusMessage('Course ready!');
      
      setTimeout(() => {
        navigate(`/course/${encodeURIComponent(course.title)}`, {
          state: { course },
        });
      }, 500);
      
    } catch (err) {
      console.error('Course generation error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            What do you want to learn today?
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Machine Learning, React Hooks, Copyright Law, Rocket Science..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        {loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {statusMessage}
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              ⏱️ This takes 30-60 seconds. Checking status every 20s...
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating your course...
            </span>
          ) : (
            '🚀 Generate Course'
          )}
        </button>
      </form>

      {/* Example topics */}
      <div className="mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">
          Try these example topics:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Machine Learning', 'React Hooks', 'Copyright Law', 'Rocket Science'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setTopic(suggestion)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
