import React from 'react';

const HEADING_ELEMENTS = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
};

const HEADING_SIZES = {
  1: 'text-4xl md:text-5xl',
  2: 'text-2xl md:text-3xl',
  3: 'text-xl md:text-2xl',
  4: 'text-lg md:text-xl',
};

export default function HeadingBlock({ text, level = 2 }) {
  const Tag = HEADING_ELEMENTS[level] || 'h2';
  const sizeClass = HEADING_SIZES[level] || HEADING_SIZES[2];

  return (
    <div className="my-8">
      <div className="relative">
        <Tag
          className={`${sizeClass} font-bold text-[var(--text-primary)]`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {text}
        </Tag>
        <div className="absolute -bottom-2 left-0 w-12 h-1 bg-[var(--accent-primary)]" aria-hidden="true" />
      </div>
    </div>
  );
}
