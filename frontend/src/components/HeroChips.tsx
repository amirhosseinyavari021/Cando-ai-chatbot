import React from 'react'

// Translated suggested chips
const SUGGESTED_CHIPS = [
  'What courses do you offer?',
  'How can I register?',
  'Where is the academy located?',
  'Tell me about the bootcamps',
  'How much do the courses cost?',
]

export const HeroChips: React.FC<{ onChipClick: (text: string) => void }> = ({ onChipClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="w-full max-w-3xl mx-auto">
        {/* Translated text */}
        <h2 className="text-3xl font-bold text-text-default mb-3">How can I help you?</h2>
        <p className="text-base text-text-muted mb-8">
          I am an intelligent assistant trained to answer your questions about Cando Academy's courses, registration, and services.
        </p>
        {/* UI MOD: Changed from horizontal scroll to a wrapping flex container for a cleaner look */}
        <div className="flex flex-wrap justify-center gap-3">
          {SUGESTED_CHIPS.map((p) => (
            <button
              key={p}
              onClick={() => onChipClick(p)}
              className="px-4 py-2 rounded-full border border-border-subtle bg-surface text-sm font-medium text-text-default whitespace-nowrap hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}