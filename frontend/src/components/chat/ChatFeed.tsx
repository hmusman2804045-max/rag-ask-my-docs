import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radar, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useAppStore } from '@/store/useAppStore';

const SUGGESTIONS = [
  'Summarise the key findings of this document.',
  'What are the stated limitations or risks?',
  'List every requirement mentioned, with page numbers.',
];

function EmptyState() {
  const askQuestion = useAppStore((state) => state.askQuestion);
  const documents = useAppStore((state) => state.documents);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-6 py-6 text-center"
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-champagne-500/25 bg-gradient-to-br from-amethyst-600/30 to-amethyst-800/30">
        <Sparkles className="h-5 w-5 text-champagne-400" />
      </div>

      <h2 className="mt-4 text-base font-medium text-ink-100">
        {documents.length === 0 ? 'The codex is empty' : 'Ask the codex'}
      </h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-400">
        {documents.length === 0
          ? 'Drop a PDF into the ingestion panel. It will be extracted, chunked, embedded and indexed into the vector store.'
          : 'Every answer is grounded in retrieved chunks. Click any citation to inspect the exact source text.'}
      </p>

      {documents.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void askQuestion(suggestion)}
              className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] text-ink-400 transition-all hover:border-amethyst-400/40 hover:bg-amethyst-500/10 hover:text-ink-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RetrievalIndicator() {
  const nChunks = useAppStore((state) => state.nChunks);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-3"
    >
      <div className="relative mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-champagne-500/30 bg-gradient-to-br from-amethyst-600/40 to-amethyst-800/40">
        <span className="absolute inset-0 animate-pulse-ring rounded-xl border border-champagne-500/40" />
        <Radar className="h-3.5 w-3.5 animate-pulse text-champagne-400" />
      </div>

      <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-obsidian-700/65 px-4 py-3 backdrop-blur-xl">
        <p className="text-[13px] text-ink-300">
          Detangling {nChunks} chunk{nChunks === 1 ? '' : 's'} from the vector index…
        </p>
        <div className="mt-2 h-px w-48 shimmer-line" />
      </div>
    </motion.div>
  );
}

export function ChatFeed() {
  const messages = useAppStore((state) => state.messages);
  const isAnswering = useAppStore((state) => state.isAnswering);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (pinnedToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Only auto-scroll while the reader is already at the bottom of the feed.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isAnswering, scrollToBottom]);

  if (messages.length === 0 && !isAnswering) {
    return (
      <div className="scrollbar-thin flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
        <EmptyState />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-2"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onStream={scrollToBottom} />
      ))}

      <AnimatePresence>{isAnswering && <RetrievalIndicator />}</AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
