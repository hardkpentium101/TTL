import React, { memo } from 'react';

const ParagraphBlock = memo(function ParagraphBlock({ text }) {
  return (
    <p className="text-[var(--text-secondary)] leading-loose mb-6 text-base md:text-lg">
      {text}
    </p>
  );
});

export default ParagraphBlock;
