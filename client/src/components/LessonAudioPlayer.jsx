import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

export default function LessonAudioPlayer({ lesson }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [usingGeminiTTS, setUsingGeminiTTS] = useState(false);
  const audioRef = useRef(null);

  const getLessonText = () => {
    if (!lesson?.content) return '';
    const textBlocks = lesson.content
      .filter(block => block.type === 'paragraph' || block.type === 'heading')
      .map(block => block.text)
      .join('. ');
    return textBlocks.substring(0, 500);
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
        text,
        language: lang
      });

      const data = response.data;
      setUsingGeminiTTS(!data.useBrowserTTS && !!data.audioContent);

      if (data.audioContent && !data.useBrowserTTS) {
        try {
          const audioData = data.audioContent;
          const mimeType = data.mimeType || 'audio/wav';
          const binaryString = atob(audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          if (mimeType.includes('L16') || mimeType.includes('pcm')) {
            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
            const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, sampleRate);
            const channelData = audioBuffer.getChannelData(0);
            const dataView = new DataView(bytes.buffer);
            for (let i = 0; i < bytes.length / 2; i++) {
              const sample = dataView.getInt16(i * 2, true);
              channelData[i] = sample / 32768.0;
            }

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => {
              setIsPlaying(false);
              setIsLoading(false);
              audioContext.close();
            };
            source.start(0);
            setIsPlaying(true);
            setIsLoading(false);
            setAudioUrl(audioContext);
          } else {
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play();
                setIsPlaying(true);
                setIsLoading(false);
              }
            }, 100);
          }
        } catch (err) {
          console.error('Error playing audio:', err);
          setError('Failed to play audio: ' + err.message);
          setIsLoading(false);
          if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            speechSynthesis.speak(utterance);
            setIsPlaying(true);
          }
        }
      } else {
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          const voices = speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice =>
            voice.lang.startsWith(lang.split('-')[0])
          );
          if (preferredVoice) utterance.voice = preferredVoice;

          utterance.onstart = () => { setIsPlaying(true); setIsLoading(false); };
          utterance.onend = () => { setIsPlaying(false); };
          utterance.onerror = (event) => {
            setIsPlaying(false);
            setIsLoading(false);
            setError('Speech synthesis failed. Please try again.');
          };

          speechSynthesis.speak(utterance);
        } else {
          setError('Your browser does not support text-to-speech');
          setIsLoading(false);
        }
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
    if (audioUrl && typeof audioUrl === 'object' && audioUrl.close) {
      audioUrl.close();
      setAudioUrl(null);
      setIsPlaying(false);
    } else if (audioRef.current) {
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
    setTimeout(() => synthesizeSpeech(newLang), 100);
  };

  useEffect(() => {
    return () => {
      handleStop();
      if (audioUrl && typeof audioUrl === 'string') {
        URL.revokeObjectURL(audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const languages = [
    { code: 'en-US', name: '🇺🇸 English (US)', label: 'English' },
    { code: 'en-GB', name: '🇬🇧 English (UK)', label: 'English UK' },
    { code: 'en-IN', name: '🇮🇳 Hinglish', label: 'Hinglish' },
    { code: 'hi-IN', name: '🇮🇳 हिंदी', label: 'Hindi' }
  ];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <span aria-hidden="true">🔊</span> Audio Narration
        </h4>

        <label htmlFor="audio-lang-select" className="sr-only">Language</label>
        <select
          id="audio-lang-select"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="input text-sm py-1.5 px-3 w-auto"
          disabled={isLoading}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className="btn btn-primary text-sm py-2.5"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner w-4 h-4 border-2" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              className="btn text-sm py-2.5"
              style={{ background: 'var(--warning)', color: 'black', borderColor: 'var(--warning-border)' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </button>
            <button
              onClick={handleStop}
              className="btn text-sm py-2.5"
              style={{ background: 'var(--error)', color: 'white', borderColor: 'var(--error-border)' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6h12v12H6z" />
              </svg>
              Stop
            </button>
          </>
        )}

        {isPlaying && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex gap-1" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--accent-primary)] rounded-full animate-pulse"
                  style={{
                    height: `${[12, 20, 16, 24, 10][i]}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">
              Playing in {languages.find(l => l.code === language)?.label}
            </span>
          </div>
        )}
      </div>

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

      {error && (
        <div className="mt-3 bg-[var(--error-bg)] text-[var(--error)] px-3 py-2 text-sm border border-[var(--error-border)]" role="alert">
          {error}
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        📖 Reading: {getLessonText().length} characters •
        {usingGeminiTTS ? (
          <span className="text-[var(--success)]">🎙️ Using Gemini 2.5 Flash TTS</span>
        ) : (
          <span>🔊 Using browser SpeechSynthesis</span>
        )}
      </p>
    </div>
  );
}
