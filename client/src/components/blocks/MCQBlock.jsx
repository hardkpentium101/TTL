import React, { useState, memo } from 'react';

const MCQBlock = memo(function MCQBlock({ question, options, answer, explanation }) {
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);

  const handleSelect = (index) => {
    if (selected !== null) return;
    setSelected(index);
    setShowExplanation(true);
    setTimeout(() => setAnimateResult(true), 50);
  };

  const isCorrect = selected === answer;

  return (
    <div className="my-6 md:my-8 rounded-xl md:rounded-2xl overflow-hidden border border-[var(--border-light)] shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[var(--accent-primary)]/15 flex items-center justify-center">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm md:text-base text-[var(--text-primary)]">Knowledge Check</h4>
            <p className="text-xs text-[var(--text-muted)] hidden sm:block">Test your understanding</p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-4 md:p-6 bg-[var(--bg-card)]">
        <p className="text-base md:text-lg font-medium text-[var(--text-primary)] mb-4 md:mb-6 leading-relaxed">
          {question}
        </p>

        {/* Options */}
        <div className="space-y-2 md:space-y-3">
          {options.map((option, index) => {
            const isSelected = selected === index;
            const isCorrectOption = index === answer;
            const showCorrect = selected !== null && isCorrectOption;
            const showIncorrect = isSelected && !isCorrectOption;

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={selected !== null}
                className={`w-full text-left p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                  showCorrect
                    ? 'border-[var(--success)] bg-[var(--success-bg)]'
                    : showIncorrect
                    ? 'border-[var(--error)] bg-[var(--error-bg)]'
                    : isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'border-[var(--border-light)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-tertiary)] bg-[var(--bg-card)]'
                } ${selected === null ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                    showCorrect
                      ? 'bg-[var(--success)] text-white'
                      : showIncorrect
                      ? 'bg-[var(--error)] text-white'
                      : isSelected
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}>
                    {showCorrect ? (
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : showIncorrect ? (
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                  <span className={`font-medium text-sm md:text-base ${
                    showCorrect ? 'text-[var(--success)]' : showIncorrect ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'
                  }`}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Result */}
        {showExplanation && (
          <div className={`mt-4 md:mt-6 p-4 md:p-5 rounded-lg md:rounded-xl transition-all duration-500 ${
            animateResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } ${isCorrect
            ? 'bg-[var(--success-bg)] border border-[var(--success)]/20'
            : 'bg-[var(--warning-bg)] border border-[var(--warning)]/20'
          }`}>
            <div className="flex items-start gap-3 md:gap-4">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCorrect ? 'bg-[var(--success)]/15' : 'bg-[var(--warning)]/15'
              }`}>
                {isCorrect ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className={`font-semibold text-sm md:text-base mb-1 md:mb-2 ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                  {isCorrect ? 'Excellent work!' : 'Not quite right'}
                </h5>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {explanation}
                </p>
                {!isCorrect && (
                  <p className="text-xs md:text-sm text-[var(--text-muted)] mt-2">
                    The correct answer was: <span className="font-medium text-[var(--success)]">{options[answer]}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default MCQBlock;
