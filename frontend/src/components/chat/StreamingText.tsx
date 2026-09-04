import { useEffect, useRef, useState } from 'react';

const CHARS_PER_TICK = 3;
const TICK_MS = 12;

/**
 * The API returns a complete answer, so the "streaming" effect is a client-side
 * reveal. It resolves instantly for replayed history and for reduced-motion users.
 */
export function StreamingText({
  text,
  animate,
  onTick,
}: {
  text: string;
  animate: boolean;
  onTick?: () => void;
}) {
  const reduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [visibleCount, setVisibleCount] = useState(animate && !reduced.current ? 0 : text.length);

  useEffect(() => {
    if (!animate || reduced.current) {
      setVisibleCount(text.length);
      return;
    }

    setVisibleCount(0);
    const timer = window.setInterval(() => {
      setVisibleCount((count) => {
        if (count >= text.length) {
          window.clearInterval(timer);
          return count;
        }
        onTick?.();
        return Math.min(text.length, count + CHARS_PER_TICK);
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [text, animate, onTick]);

  const isTyping = visibleCount < text.length;

  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-100 sm:text-base">
      {text.slice(0, visibleCount)}
      {isTyping && (
        <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-champagne-400 align-middle" />
      )}
    </p>
  );
}
