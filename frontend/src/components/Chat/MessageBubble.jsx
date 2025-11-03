import React from 'react';
import styles from './MessageBubble.module.css';
import { FiLink } from 'react-icons/fi'; // Using react-icons for a nice link icon

// --- New Sub-Component for Roadmap Rendering ---
const RoadmapCard = ({ roadmap, lang }) => {
  const intro =
    lang === 'fa'
      ? `حتماً! این مسیر یادگیری برای ${roadmap.role_title} هست 👇`
      : `Sure! Here’s the learning roadmap for ${roadmap.role_title}:`;

  const outro =
    lang === 'fa'
      ? 'اگه خواستی مسیر شخصی‌سازی‌شده‌ت رو هم برات می‌چینم 😉'
      : 'Would you like me to personalize this roadmap for you?';

  return (
    <div
      className={`p-1 rounded-lg max-w-md text-gray-800 dark:text-white ${lang === 'fa' ? 'rtl' : 'ltr'
        }`}
      style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}
    >
      <p className="font-semibold mb-3 text-base">{intro}</p>
      <ul className="space-y-3">
        {roadmap.tracks
          .sort((a, b) => a.order - b.order)
          .map((track) => (
            <li
              key={track.order}
              className="p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {track.required ? '✔️' : '📘'}{' '}
                  {lang === 'fa' ? `مرحله ${track.order}` : `Step ${track.order}`}
                </span>
                {track.hours && (
                  <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                    {lang === 'fa'
                      ? `${track.hours} ساعت`
                      : `${track.hours} hours`}
                  </span>
                )}
              </div>
              <h4 className="text-lg font-semibold mt-1">{track.title}</h4>
              {track.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <span className="font-semibold">
                    {lang === 'fa' ? 'یادداشت: ' : 'Notes: '}
                  </span>
                  {track.notes}
                </p>
              )}
              {track.link && (
                <a
                  href={track.link}
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="inline-flex items-center text-sm text-blue-500 hover:underline mt-3"
                >
                  <FiLink
                    className={lang === 'fa' ? 'ml-1' : 'mr-1'}
                    size={14}
                  />
                  {lang === 'fa' ? 'مشاهده دوره' : 'View Course'}
                </a>
              )}
            </li>
          ))}
      </ul>
      <p className="mt-4 text-sm italic">{outro}</p>
    </div>
  );
};

// --- Main MessageBubble Component ---
const MessageBubble = ({ message }) => {
  // message prop structure: { sender: 'user' | 'bot', content: string | object }
  const { sender, content } = message;
  const isUser = sender === 'user';

  const isRoadmap =
    typeof content === 'object' && content !== null && content.type === 'roadmap';

  // Determine language for text alignment (RTL for Farsi, LTR for English/User)
  let textDir = 'ltr';
  if (!isUser && !isRoadmap && /[آ-ی]/.test(content)) {
    textDir = 'rtl';
  } else if (isUser && /[آ-ی]/.test(content)) {
    textDir = 'rtl';
  } else if (isRoadmap && content.lang === 'fa') {
    textDir = 'rtl';
  }

  const bubbleClass = isUser
    ? `${styles.userBubble} bg-blue-500 text-white`
    : `${styles.botBubble} bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-white`;

  return (
    <div
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ direction: textDir }}
    >
      <div
        className={`${styles.bubble} ${bubbleClass} p-4 rounded-lg max-w-lg shadow-md`}
      >
        {isRoadmap ? (
          <RoadmapCard roadmap={content.data} lang={content.lang} />
        ) : (
          <p className="whitespace-pre-wrap">{content}</p> // Use pre-wrap to respect newlines
        )}
      </div>
    </div>
  );
};

export default MessageBubble;