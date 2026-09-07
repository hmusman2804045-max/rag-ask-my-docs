import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radar, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useAppStore } from '@/store/useAppStore';

const SUGGESTIONS = [
  'Summarise the key findings of this document.',
  'What are the stated limitations or methodology?',
  'List every key metric or requirement mentioned.',
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
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/20">
        <Sparkles className="h-6 w-6" />
      </div>

      <h2 className="mt-4 font-display text-base font-bold text-ink-100 sm:text-lg">
        {documents.length === 0 ? 'Document Intelligence Engine' : 'Ask Your Knowledge Base'}
      </h2>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-ink-400 sm:text-sm">
        {documents.length === 0
          ? 'Upload a PDF to extract text, generate 384d FastEmbed vectors, and start conversational retrieval.'
          : 'Answers are synthesized strictly from retrieved context chunks with traceable citations.'}
      </p>

      {documents.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void askQuestion(suggestion)}
              className="rounded-xl border border-white/5 bg-charcoal-800/80 px-3.5 py-1.5 text-xs text-ink-300 transition-all hover:border-amber-500/40 hover:bg-charcoal-750 hover:text-amber-300"
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
      <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
        <span className="absolute inset-0 animate-ping rounded-xl border border-amber-500/40 opacity-40" />
        <Radar className="h-4 w-4 animate-spin text-amber-400" />
      </div>

      <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-charcoal-850/90 px-4 py-3 backdrop-blur-xl">
        <p className="text-xs text-ink-200 sm:text-sm font-medium">
          Retrieving top {nChunks} semantic chunk{nChunks === 1 ? '' : 's'} via MongoDB Atlas Vector Search…
        </p>
        <div className="mt-2 h-0.5 w-44 overflow-hidden rounded-full bg-charcoal-800">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
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
      className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-2"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onStream={scrollToBottom} />
      ))}

      <AnimatePresence>{isAnswering && <RetrievalIndicator />}</AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
