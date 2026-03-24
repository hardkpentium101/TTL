import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function VideoBlock({ query }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [error, setError] = useState('');

  // Auto-search videos on mount when query changes
  useEffect(() => {
    if (query) {
      searchVideos();
    }
    // Reset state when query changes
    return () => {
      setVideos([]);
      setSelectedVideoIndex(0);
    };
  }, [query]);

  const searchVideos = async () => {
    if (!query) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/youtube/search', {
        params: { q: query, maxResults: 8 }
      });

      const videoItems = response.data.items || [];
      setVideos(videoItems);
      setSelectedVideoIndex(0);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVideoId = (video) => {
    return video?.id?.videoId;
  };

  if (loading) {
    return (
      <div className="my-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📹</span>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Video Resource
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {query}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading videos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📹</span>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Video Resource
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {query}
            </p>
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="space-y-4">
            {/* Main Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${getVideoId(videos[selectedVideoIndex])}`}
                title={videos[selectedVideoIndex]?.snippet?.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Info */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {videos[selectedVideoIndex]?.snippet?.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {videos[selectedVideoIndex]?.snippet?.description}
              </p>
            </div>

            {/* Horizontal Scroll Video Thumbnails */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                More videos:
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {videos.map((video, index) => (
                  <button
                    key={getVideoId(video)}
                    onClick={() => setSelectedVideoIndex(index)}
                    className={`flex-shrink-0 flex gap-2 p-2 rounded-lg transition-all text-left w-48 ${
                      selectedVideoIndex === index
                        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <img
                      src={video?.snippet?.thumbnails?.medium?.url}
                      alt={video?.snippet?.title}
                      className="w-24 h-16 object-cover rounded flex-shrink-0"
                    />
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 flex-1 overflow-hidden">
                      {video?.snippet?.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Find relevant videos for this lesson
            </p>
            <button
              onClick={searchVideos}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Videos
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
