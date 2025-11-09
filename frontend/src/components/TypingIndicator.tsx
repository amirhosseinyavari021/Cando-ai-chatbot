export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="sr-only">typing…</span>
      <div className="w-2.5 h-2.5 rounded-full bg-neutral-500 dark:bg-neutral-300 animate-bounce" />
      <div className="w-2.5 h-2.5 rounded-full bg-neutral-500 dark:bg-neutral-300 animate-bounce [animation-delay:120ms]" />
      <div className="w-2.5 h-2.5 rounded-full bg-neutral-500 dark:bg-neutral-300 animate-bounce [animation-delay:240ms]" />
    </div>
  );
}
