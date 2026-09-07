import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber, truncateMiddle } from '@/lib/utils';

export function DocumentList({ onOpenUpload }: { onOpenUpload?: () => void }) {
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
    <section className="flex flex-col">
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748B]">
          Recent Documents
        </span>
        {documents.length > 0 && onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-amber-primary transition-colors hover:bg-amber-500/10"
          >
            <Plus className="h-3 w-3" />
            Upload
          </button>
        )}
      </div>

      <div className="mt-2.5 space-y-1.5">
        {isLoading && documents.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-[#94A3B8]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-primary" />
            Loading knowledge base…
          </div>
        )}

        {!isLoading && documents.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0E13]/50 p-3.5 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#151A22] text-[#94A3B8]">
              <FileText className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-semibold text-white">No documents yet</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-[#94A3B8]">
              Upload your first PDF to build your knowledge base.
            </p>
            {onOpenUpload && (
              <button
                type="button"
                onClick={onOpenUpload}
                className="btn-amber-primary mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Upload PDF</span>
              </button>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {documents.map((doc) => (
            <motion.article
              key={doc.doc_name}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'group relative rounded-xl border border-white/[0.07] bg-[#11151C] p-2.5 transition-all duration-200',
                'hover:border-amber-primary/30 hover:bg-[#151A22]',
                pending === doc.doc_name && 'opacity-50',
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-primary/25 bg-amber-500/10 text-amber-primary">
                  <FileText className="h-3.5 w-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white" title={doc.doc_name}>
                    {truncateMiddle(doc.doc_name, 20)}
                  </p>
                  <p className="mt-0.5 text-data text-[10.5px] text-[#94A3B8]">
                    {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} · {doc.chunk_count} chunks
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(doc.doc_name)}
                  disabled={pending === doc.doc_name}
                  className="rounded-lg p-1 text-[#64748B] opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-400 focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Delete ${doc.doc_name}`}
                  title="Delete document"
                >
                  {pending === doc.doc_name ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
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
