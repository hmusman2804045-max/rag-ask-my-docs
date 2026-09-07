import { motion } from 'framer-motion';
import { AlertTriangle, Quote, Sparkles, User } from 'lucide-react';
import { StreamingText } from './StreamingText';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatPages, formatPercent, truncateMiddle } from '@/lib/utils';
import type { ChatMessage, Citation } from '@/types';

function CitationTag({
  citation,
  index,
  siblings,
}: {
  citation: Citation;
  index: number;
  siblings: Citation[];
}) {
  const openCitation = useAppStore((state) => state.openCitation);
  const activeCitation = useAppStore((state) => state.activeCitation);
  const isInspectorOpen = useAppStore((state) => state.isInspectorOpen);

  const isActive = isInspectorOpen && activeCitation?.chunk_id === citation.chunk_id;

  return (
    <motion.button
      type="button"
      onClick={() => openCitation(citation, siblings)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.25 }}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-data text-xs transition-all duration-200',
        isActive
          ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-500/20'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200',
      )}
      title={`Inspect chunk ${citation.chunk_id}`}
    >
      <Quote className="h-2.5 w-2.5 opacity-70" />
      <span>{formatPages(citation.page_numbers)}</span>
      <span className="text-amber-500/50">|</span>
      <span className="max-w-[9rem] truncate">{truncateMiddle(citation.doc_name, 18)}</span>
      <span className="text-amber-500/50">|</span>
      <span className={cn(citation.similarity_score >= 0.7 && 'text-amber-200 font-semibold')}>
        {formatPercent(citation.similarity_score)} match
      </span>
    </motion.button>
  );
}

export function MessageBubble({
  message,
  onStream,
}: {
  message: ChatMessage;
  onStream?: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl border',
          isUser
            ? 'border-white/10 bg-charcoal-800 text-ink-300'
            : message.error
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-amber-500/30 bg-amber-500/15 text-amber-400',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : message.error ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div className={cn('min-w-0 max-w-[min(42rem,85%)]', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-2xl border px-4 py-3.5 backdrop-blur-xl',
            isUser
              ? 'rounded-tr-sm border-amber-500/30 bg-amber-500/10 text-ink-100 shadow-md shadow-amber-500/5'
              : message.error
                ? 'rounded-tl-sm border-red-500/30 bg-red-500/10 text-red-200'
                : 'rounded-tl-sm border-white/10 bg-charcoal-850/90 text-ink-100 shadow-md shadow-black/40',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[14px] font-normal leading-relaxed text-ink-100">
              {message.content}
            </p>
          ) : (
            <StreamingText
              text={message.content}
              animate={Boolean(message.animate)}
              onTick={onStream}
            />
          )}
        </div>

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.citations.map((citation, index) => (
              <CitationTag
                key={citation.chunk_id}
                citation={citation}
                index={index}
                siblings={message.citations ?? []}
              />
            ))}
          </div>
        )}

        {!isUser && message.model && (
          <p className="mt-2 font-mono text-[11px] text-ink-500">
            {message.model}
            {message.isMock && ' · mock mode'}
            {message.usage?.total_tokens ? ` · ${message.usage.total_tokens} tokens` : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}
