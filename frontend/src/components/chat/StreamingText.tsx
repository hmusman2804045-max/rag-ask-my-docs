import { useEffect, useRef, useState } from 'react';
import { renderFormattedContent } from '@/lib/formatMarkdown';

const CHARS_PER_TICK = 4;
const TICK_MS = 10;

/**
 * The API returns a complete answer, so the "streaming" effect is a client-side
 * reveal. When typing finishes, it seamlessly renders full rich formatting.
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

  if (!isTyping) {
    return <div className="text-[15.5px] leading-relaxed text-slate-100 sm:text-base">{renderFormattedContent(text)}</div>;
  }

  return (
    <div className="text-[15.5px] leading-relaxed text-slate-100 sm:text-base">
      <p className="whitespace-pre-wrap">
        {text.slice(0, visibleCount)}
        <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-champagne-400 align-middle" />
      </p>
    </div>
  );
}
