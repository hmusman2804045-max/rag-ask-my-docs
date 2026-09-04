import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Hash, Layers, Target, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ScoreBar, SectionLabel } from '@/components/ui/Primitives';
import { cn, formatPages, formatPercent } from '@/lib/utils';

function Field({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
        <Icon className="h-3 w-3 text-gold-300" />
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 break-words text-xs text-ink-100',
          mono && 'text-data text-[11px] text-champagne-300',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CitationDrawer() {
  const citation = useAppStore((state) => state.activeCitation);
  const isOpen = useAppStore((state) => state.isInspectorOpen);
  const closeInspector = useAppStore((state) => state.closeInspector);
  const lastCitations = useAppStore((state) => state.lastCitations);
  const openCitation = useAppStore((state) => state.openCitation);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeInspector();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeInspector]);

  return (
    <AnimatePresence>
      {isOpen && citation && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeInspector}
            className="fixed inset-0 z-40 bg-titanium-950/50 backdrop-blur-[2px] xl:hidden"
          />

          <motion.aside
            initial={{ x: '100%', opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            role="dialog"
            aria-label="Source citation inspector"
            className="glass fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col rounded-none border-y-0 border-r-0 p-5 xl:rounded-l-3xl"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>Source inspector</SectionLabel>
                <h2 className="mt-1.5 text-sm font-medium text-ink-100">
                  Retrieved context chunk
                </h2>
              </div>
              <button
                type="button"
                onClick={closeInspector}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
                aria-label="Close inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="my-4 h-px w-full gold-divider" />

            <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="rounded-xl border border-champagne-500/25 bg-champagne-500/[0.06] p-4">
                <div className="flex items-baseline justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-champagne-400">
                    <Target className="h-3 w-3" />
                    Similarity score
                  </p>
                  <p className="text-data text-xl text-champagne-300">
                    {formatPercent(citation.similarity_score)}
                  </p>
                </div>
                <ScoreBar score={citation.similarity_score} className="mt-3" />
                <p className="mt-2 text-data text-[10px] text-ink-500">
                  cosine similarity · {citation.similarity_score.toFixed(4)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field icon={FileText} label="Document" value={citation.doc_name} />
                <Field icon={Layers} label="Location" value={formatPages(citation.page_numbers)} />
              </div>

              <Field icon={Hash} label="Chunk ID" value={citation.chunk_id} mono />

              <div>
                <SectionLabel className="px-1">Raw chunk text from Chroma</SectionLabel>
                <div className="mt-2 rounded-xl border border-white/5 bg-titanium-950/60 p-4">
                  {citation.text_snippet ? (
                    <p className="whitespace-pre-wrap text-data text-[11.5px] leading-relaxed text-ink-300">
                      {citation.text_snippet}
                    </p>
                  ) : (
                    <p className="text-[11.5px] italic leading-relaxed text-ink-500">
                      No snippet was returned for this chunk.
                    </p>
                  )}
                </div>
              </div>

              {lastCitations.length > 1 && (
                <div>
                  <SectionLabel className="px-1">Other chunks in this answer</SectionLabel>
                  <div className="mt-2 space-y-1.5">
                    {lastCitations
                      .filter((item) => item.chunk_id !== citation.chunk_id)
                      .map((item) => (
                        <button
                          key={item.chunk_id}
                          type="button"
                          onClick={() => openCitation(item)}
                          className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-left transition-all hover:border-gold-400/40 hover:bg-gold-500/[0.08]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] text-ink-300">{item.doc_name}</p>
                            <p className="mt-0.5 text-data text-[10px] text-ink-500">
                              {formatPages(item.page_numbers)}
                            </p>
                          </div>
                          <span className="text-data text-[11px] text-champagne-400">
                            {formatPercent(item.similarity_score)}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 border-t border-white/5 pt-3 text-[10px] leading-relaxed text-ink-500">
              This chunk is highlighted on the 3D codex while the inspector is open. Press Esc to
              close.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
