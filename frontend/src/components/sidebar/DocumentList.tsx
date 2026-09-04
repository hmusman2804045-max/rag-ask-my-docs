import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SectionLabel } from '@/components/ui/Primitives';
import { cn, formatNumber, truncateMiddle } from '@/lib/utils';

export function DocumentList() {
  const documents = useAppStore((state) => state.documents);
  const isLoading = useAppStore((state) => state.isDocumentsLoading);
  const deleteDocument = useAppStore((state) => state.deleteDocument);
  const [pending, setPending] = useState<string | null>(null);

  const handleDelete = async (docName: string) => {
    setPending(docName);
    await deleteDocument(docName);
    setPending(null);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-1">
        <SectionLabel>Indexed repository</SectionLabel>
        <span className="font-mono text-[10px] text-ink-500">
          {isLoading ? '···' : `${documents.length} docs`}
        </span>
      </div>

      <div className="scrollbar-thin mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {isLoading && documents.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-ink-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reading the vector index…
          </div>
        )}

        {!isLoading && documents.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
            <p className="text-xs text-ink-400">No documents indexed yet.</p>
            <p className="mt-1 text-[11px] text-ink-500">
              Upload a PDF to give the codex something to reason over.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {documents.map((doc) => (
            <motion.article
              key={doc.doc_name}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors',
                'hover:border-amethyst-400/30 hover:bg-amethyst-500/[0.06]',
                pending === doc.doc_name && 'opacity-50',
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-champagne-500/25 bg-champagne-500/10">
                  <FileText className="h-3.5 w-3.5 text-champagne-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-100" title={doc.doc_name}>
                    {truncateMiddle(doc.doc_name, 24)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-ink-500">
                    {doc.page_count} pages · {doc.chunk_count} chunks ·{' '}
                    {formatNumber(doc.word_count)} words
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(doc.doc_name)}
                  disabled={pending === doc.doc_name}
                  className="rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Delete ${doc.doc_name} from the index`}
                >
                  {pending === doc.doc_name ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
