import React from 'react'

const SUGGESTED_CHIPS = [
  'چه دوره‌هایی ارائه می‌دهید؟',
  'چطور می‌توانم ثبت‌نام کنم؟',
  'آدرس آکادمی کجاست؟',
  'درباره‌ی بوت‌کمپ‌ها توضیح بده',
  'هزینه دوره‌ها چقدر است؟',
]

export const HeroChips: React.FC<{ onChipClick: (text: string) => void }> = ({ onChipClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="w-full max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-text-default mb-3">چطور کمکتان کنم؟</h2>
        <p className="text-base text-text-muted mb-8">من یک دستیار هوشمند هستم که برای پاسخ به سؤالات شما درباره دوره‌ها، ثبت‌نام و خدمات آکادمی کندو آموزش دیده‌ام.</p>
        <div className="w-full overflow-hidden">
          <div className="flex gap-3 pb-4 overflow-x-auto no-scrollbar" style={{ direction: 'rtl' }}>
            {SUGGESTED_CHIPS.map((p) => (
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
    </div>
  )
}
