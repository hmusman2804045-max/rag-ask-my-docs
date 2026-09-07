import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  UploadCloud,
  Trash2,
  MessageSquare,
  Search,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatBytes } from '@/lib/utils';
import type { IndexedDocument } from '@/types';

export function DocumentsDashboard() {
  const documents = useAppStore((state) => state.documents);
  const deleteDocument = useAppStore((state) => state.deleteDocument);
  const setUploadModalOpen = useAppStore((state) => state.setUploadModalOpen);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const askQuestion = useAppStore((state) => state.askQuestion);

  const [searchQuery, setSearchQuery] = useState('');
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) =>
    doc.doc_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);

  const handleAskAboutDoc = (docName: string) => {
    setActiveTab('home');
    void askQuestion(`Please provide a comprehensive summary and key takeaways from ${docName}.`);
  };

  const handleDelete = async (docName: string) => {
    setDeletingDoc(docName);
    try {
      await deleteDocument(docName);
    } finally {
      setDeletingDoc(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink-100 sm:text-2xl">
              Document Repository
            </h2>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-400">
              {documents.length} {documents.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-400">
            Vectorized knowledge corpus with {totalChunks} indexed chunks ready for neural retrieval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="btn-amber-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <UploadCloud className="h-4 w-4" />
            Upload PDF
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter indexed documents..."
            className="w-full rounded-xl border border-white/5 bg-charcoal-850/80 py-2 pl-9 pr-4 text-xs text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-amber-500/50 focus:bg-charcoal-800"
          />
        </div>
      </div>

      {/* Document Grid / List */}
      <div className="mt-5 flex-1 overflow-y-auto pr-1">
        {filteredDocs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <FileText className="h-10 w-10 text-ink-600 mb-3" />
            <p className="text-sm font-medium text-ink-300">
              {searchQuery ? 'No matching documents found' : 'No documents indexed yet'}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {searchQuery
                ? 'Try a different search query.'
                : 'Upload your first PDF to begin building your neural knowledge base.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredDocs.map((doc: IndexedDocument) => (
                <motion.div
                  key={doc.doc_name}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="card-interactive group flex flex-col justify-between rounded-xl p-4"
                >
                  <div>
                    {/* Top Row: Icon + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Ready</span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <h3
                      className="mt-3 truncate font-display text-sm font-semibold text-ink-100 group-hover:text-amber-300 transition-colors"
                      title={doc.doc_name}
                    >
                      {doc.doc_name}
                    </h3>

                    {/* Metadata Specs */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-data text-[11px] text-ink-400">
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-amber-400/80" />
                        <span>{doc.chunk_count} Chunks</span>
                      </div>
                      {doc.total_characters && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-ink-500" />
                          <span>{doc.total_characters.toLocaleString()} chars</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => handleAskAboutDoc(doc.doc_name)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(doc.doc_name)}
                      disabled={deletingDoc === doc.doc_name}
                      className="flex items-center gap-1 text-xs text-ink-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Purge document from vector index"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
