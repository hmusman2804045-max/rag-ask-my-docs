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
          ? 'border-champagne-300/60 bg-champagne-300/15 text-champagne-200 shadow-gold'
          : 'border-gold-500/30 bg-gold-500/[0.1] text-champagne-300 shadow-[0_0_18px_-8px_rgba(245,158,11,0.7)] hover:border-gold-400/60 hover:bg-gold-500/[0.16] hover:text-champagne-200',
      )}
      title={`Inspect chunk ${citation.chunk_id}`}
    >
      <Quote className="h-2.5 w-2.5 opacity-70" />
      <span>{formatPages(citation.page_numbers)}</span>
      <span className="text-gold-500/60">|</span>
      <span className="max-w-[9rem] truncate">{truncateMiddle(citation.doc_name, 18)}</span>
      <span className="text-gold-500/60">|</span>
      <span className={cn(citation.similarity_score >= 0.7 && 'text-champagne-200')}>
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
            ? 'border-white/10 bg-white/[0.04]'
            : message.error
              ? 'border-rose-500/30 bg-rose-500/10'
              : 'border-champagne-500/30 bg-gradient-to-br from-gold-600/40 to-gold-800/40',
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-ink-400" />
        ) : message.error ? (
          <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-champagne-400" />
        )}
      </div>

      <div className={cn('min-w-0 max-w-[min(42rem,85%)]', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-2xl border px-4 py-3.5 backdrop-blur-xl',
            isUser
              ? 'rounded-tr-sm border-gold-400/35 bg-gold-500/[0.16] shadow-[0_4px_20px_-4px_rgba(245,158,11,0.2)]'
              : message.error
                ? 'rounded-tl-sm border-rose-500/30 bg-rose-500/[0.09]'
                : 'rounded-tl-sm border-white/12 bg-titanium-800/90 shadow-glass',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-amber-50 sm:text-base">
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
          <p className="mt-2 text-data text-xs text-ink-500">
            {message.model}
            {message.isMock && ' · mock mode'}
            {message.usage?.total_tokens ? ` · ${message.usage.total_tokens} tokens` : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}
