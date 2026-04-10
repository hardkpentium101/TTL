import React, { memo } from 'react';

const HeadingBlock = memo(function HeadingBlock({ text }) {
  return (
    <div className="my-8">
      <div className="relative">
        <h2
          className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {text}
        </h2>
        <div className="absolute -bottom-2 left-0 w-12 h-1 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
      </div>
    </div>
  );
});

export default HeadingBlock;
