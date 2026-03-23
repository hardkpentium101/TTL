import { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

export default function LessonAudioPlayer({ lesson }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en-US'); // Default to English
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  // Extract lesson text content for TTS
  const getLessonText = () => {
    if (!lesson?.content) return '';
    
    const textBlocks = lesson.content
      .filter(block => block.type === 'paragraph' || block.type === 'heading')
      .map(block => block.text)
      .join('. ');
    
    return textBlocks.substring(0, 500); // Limit to 500 chars for demo
  };

  const synthesizeSpeech = async (lang) => {
    const text = getLessonText();
    if (!text) {
      setError('No text content available for audio');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/tts/synthesize', {
        text: text,
        language: lang
      });

      // Use browser SpeechSynthesis API
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a voice matching the language
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(lang.split('-')[0])
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = (event) => {
          setIsPlaying(false);
          setIsLoading(false);
          console.error('Speech synthesis error:', event);
          setError('Speech synthesis failed. Please try again.');
        };
        
        speechSynthesis.speak(utterance);
      } else {
        setError('Your browser does not support text-to-speech');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error synthesizing speech:', err);
      setError('Failed to generate audio. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      synthesizeSpeech(language);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if ('speechSynthesis' in window) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    handleStop();
    setAudioUrl(null);
    // Auto-play in new language
    setTimeout(() => synthesizeSpeech(newLang), 100);
  };

  useEffect(() => {
    return () => {
      handleStop();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const languages = [
    { code: 'en-US', name: '🇺🇸 English (US)', label: 'English' },
    { code: 'en-GB', name: '🇬🇧 English (UK)', label: 'English UK' },
    { code: 'en-IN', name: '🇮🇳 Hinglish', label: 'Hinglish' },
    { code: 'hi-IN', name: '🇮🇳 हिंदी', label: 'Hindi' }
  ];

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
          <span>🔊</span> Audio Narration
        </h4>
        
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isLoading}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center gap-3">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-5 py-2.5 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
              Stop
            </button>
          </>
        )}

        {/* Progress indicator */}
        {isPlaying && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 16 + 8}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-indigo-600 dark:text-indigo-400">
              Playing in {languages.find(l => l.code === language)?.label}
            </span>
          </div>
        )}
      </div>

      {/* Hidden audio element for API-generated audio */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setError('Audio playback failed')}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Info text */}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        📖 Reading: {getLessonText().length} characters • 
        {!GEMINI_API_KEY ? ' Using browser TTS (add API key for better quality)' : ' Using Google Cloud TTS'}
      </p>
    </div>
  );
}

// Add this helper to access env var in component
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
