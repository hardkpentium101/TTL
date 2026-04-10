import React, { useState, memo } from 'react';

const CodeBlock = memo(function CodeBlock({ language, text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="my-6 md:my-8 rounded-lg md:rounded-xl overflow-hidden border border-[var(--border-medium)]">
      {/* Header */}
      <div className="bg-[var(--bg-tertiary)] px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[var(--error)]/60" />
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[var(--warning)]/60" />
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[var(--success)]/60" />
          </div>
          <span className="text-xs md:text-sm font-medium text-[var(--text-secondary)] font-mono hidden sm:inline">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="bg-[#1a1d1a] dark:bg-[#0d0f0d] p-4 md:p-5 overflow-x-auto">
        <code className="text-xs md:text-sm font-mono text-[#e5e5e5] leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
          {text}
        </code>
      </pre>
    </div>
  );
});

export default CodeBlock;
