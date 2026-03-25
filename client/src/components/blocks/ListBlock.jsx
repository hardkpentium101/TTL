import React from 'react';

export default function ListBlock({ items }) {
  return (
    <ul className="my-6 space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-4 text-[var(--text-secondary)]"
        >
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
