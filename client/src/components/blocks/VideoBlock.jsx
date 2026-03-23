import { useState } from 'react';

export default function VideoBlock({ query }) {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchVideo = async () => {
    setLoading(true);
    try {
      // In production, call backend YouTube API
      // For now, show a placeholder
      setVideoId('placeholder');
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
          📹 Video: {query}
        </p>
        {videoId ? (
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
            <p className="text-gray-500">Video player would render here</p>
          </div>
        ) : (
          <button
            onClick={searchVideo}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Find Related Video'}
          </button>
        )}
      </div>
    </div>
  );
}
