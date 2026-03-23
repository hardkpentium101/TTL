import { useState } from 'react';

export default function MCQBlock({ question, options, answer, explanation }) {
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (index) => {
    setSelected(index);
    setShowExplanation(true);
  };

  return (
    <div className="my-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
        📝 Quiz: {question}
      </h4>
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              selected === index
                ? index === answer
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="font-medium">{String.fromCharCode(65 + index)}.</span>{' '}
            {option}
          </button>
        ))}
      </div>
      {showExplanation && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            selected === answer
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
        >
          <p className="font-medium mb-1">
            {selected === answer ? '✅ Correct!' : '❌ Not quite right.'}
          </p>
          <p className="text-sm">{explanation}</p>
        </div>
      )}
    </div>
  );
}
