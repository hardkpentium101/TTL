import React from 'react';

export default function ParagraphBlock({ text }) {
  return (
    <p className="text-[var(--text-secondary)] leading-loose mb-6 text-base md:text-lg">
      {text}
    </p>
  );
}
