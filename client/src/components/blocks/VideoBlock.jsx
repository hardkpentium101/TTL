import React, { useState } from 'react';
import { api } from '../../utils/api';

export default function VideoBlock({ query }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

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
      setHasSearched(true);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVideoId = (video) => video?.id?.videoId;

  if (loading) {
    return (
      <div className="my-8">
        <div className="card p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded mb-2" />
              <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded" />
            </div>
          </div>
          <div className="aspect-video bg-[var(--bg-tertiary)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--accent-secondary)]/10 to-transparent px-6 py-4 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary)]/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">Video Resource</h4>
              <p className="text-sm text-[var(--text-muted)]">{query}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {videos.length > 0 || hasSearched ? (
            <div className="space-y-6 animate-fade-in">
              {/* Main Video */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                {videos.length > 0 ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getVideoId(videos[selectedVideoIndex])}`}
                    title={videos[selectedVideoIndex]?.snippet?.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>No videos found</p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-[var(--text-primary)] text-lg">
                    {videos[selectedVideoIndex]?.snippet?.title}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                    {videos[selectedVideoIndex]?.snippet?.description}
                  </p>
                </div>
              )}

              {/* Video Thumbnails */}
              {videos.length > 1 && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                    Related Videos
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {videos.slice(0, 4).map((video, index) => (
                      <button
                        key={getVideoId(video)}
                        onClick={() => setSelectedVideoIndex(index)}
                        className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${
                          selectedVideoIndex === index
                            ? 'ring-2 ring-[var(--accent-primary)] scale-[1.02]'
                            : 'hover:scale-[1.02]'
                        }`}
                      >
                        <img
                          src={video?.snippet?.thumbnails?.medium?.url}
                          alt={video?.snippet?.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                            {video?.snippet?.title}
                          </p>
                        </div>
                        {selectedVideoIndex === index && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent-secondary)]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">Find Video Resources</h4>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Search YouTube for videos related to this lesson
              </p>
              <button
                onClick={searchVideos}
                disabled={loading}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Videos
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[var(--error)]">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
