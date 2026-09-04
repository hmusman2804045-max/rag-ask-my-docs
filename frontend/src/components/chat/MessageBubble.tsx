import { motion } from 'framer-motion';
import { AlertTriangle, Quote, Sparkles, User } from 'lucide-react';
import { StreamingText } from './StreamingText';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatPages, formatPercent, truncateMiddle } from '@/lib/utils';
import type { ChatMessage, Citation } from '@/types';

function CitationTag({ citation, index }: { citation: Citation; index: number }) {
  const openCitation = useAppStore((state) => state.openCitation);
  const activeCitation = useAppStore((state) => state.activeCitation);
  const isInspectorOpen = useAppStore((state) => state.isInspectorOpen);

  const isActive = isInspectorOpen && activeCitation?.chunk_id === citation.chunk_id;

  return (
    <motion.button
      type="button"
      onClick={() => openCitation(citation)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.25 }}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[10px] transition-all duration-200',
        isActive
          ? 'border-champagne-400/60 bg-champagne-500/15 text-champagne-200 shadow-gold'
          : 'border-amethyst-400/25 bg-amethyst-500/[0.08] text-ink-300 hover:border-champagne-500/40 hover:bg-champagne-500/10 hover:text-champagne-200',
      )}
      title={`Inspect chunk ${citation.chunk_id}`}
    >
      <Quote className="h-2.5 w-2.5 opacity-70" />
      <span>{formatPages(citation.page_numbers)}</span>
      <span className="text-ink-500">|</span>
      <span className="max-w-[9rem] truncate">{truncateMiddle(citation.doc_name, 18)}</span>
      <span className="text-ink-500">|</span>
      <span className={cn(citation.similarity_score >= 0.7 && 'text-champagne-300')}>
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
              : 'border-champagne-500/30 bg-gradient-to-br from-amethyst-600/40 to-amethyst-800/40',
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
            'rounded-2xl border px-4 py-3 backdrop-blur-xl',
            isUser
              ? 'rounded-tr-sm border-amethyst-400/25 bg-amethyst-500/[0.12]'
              : message.error
                ? 'rounded-tl-sm border-rose-500/25 bg-rose-500/[0.07]'
                : 'rounded-tl-sm border-white/10 bg-obsidian-700/65',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-100">
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
              <CitationTag key={citation.chunk_id} citation={citation} index={index} />
            ))}
          </div>
        )}

        {!isUser && message.model && (
          <p className="mt-2 font-mono text-[10px] text-ink-500">
            {message.model}
            {message.isMock && ' · mock mode'}
            {message.usage?.total_tokens ? ` · ${message.usage.total_tokens} tokens` : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}
