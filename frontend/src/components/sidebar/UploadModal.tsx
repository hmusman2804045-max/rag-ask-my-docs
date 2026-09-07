import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatBytes } from '@/lib/utils';

const STAGES = [
  { key: 'uploading', label: 'Uploading Document', desc: 'Streaming PDF binary payload' },
  { key: 'extracting', label: 'Extracting Text', desc: 'Parsing pages and layout elements' },
  { key: 'chunking', label: 'Semantic Chunking', desc: 'Recursive token character splitting' },
  { key: 'embedding', label: 'Generating Embeddings', desc: 'FastEmbed BAAI/bge-small-en-v1.5' },
  { key: 'indexing', label: 'Atlas Vector Indexing', desc: 'Persisting 384d embeddings in MongoDB' },
];

export function UploadModal() {
  const isUploadModalOpen = useAppStore((state) => state.isUploadModalOpen);
  const setUploadModalOpen = useAppStore((state) => state.setUploadModalOpen);
  const upload = useAppStore((state) => state.upload);
  const uploadDocument = useAppStore((state) => state.uploadDocument);
  const resetUpload = useAppStore((state) => state.resetUpload);

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUploadModalOpen && upload.phase !== 'uploading' && upload.phase !== 'indexing') {
        setUploadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUploadModalOpen, upload.phase, setUploadModalOpen]);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.pdf')) {
          setSelectedFile(file);
          void uploadDocument(file);
        } else {
          useAppStore.getState().pushToast({
            tone: 'error',
            title: 'Unsupported file format',
            description: 'Only PDF documents (.pdf) are supported.',
          });
        }
      }
    },
    [uploadDocument],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      void uploadDocument(file);
    }
  };

  const handleClose = () => {
    if (upload.phase === 'uploading' || upload.phase === 'indexing') return;
    resetUpload();
    setSelectedFile(null);
    setUploadModalOpen(false);
  };

  if (!isUploadModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="card-premium relative w-full max-w-xl overflow-hidden rounded-2xl p-6 sm:p-8"
        >
          {/* Top Amber Accent Line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink-100 sm:text-lg">
                  Upload PDF Document
                </h3>
                <p className="text-xs text-ink-400">
                  Document will be extracted, chunked, and vectorized for RAG.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={upload.phase === 'uploading' || upload.phase === 'indexing'}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-charcoal-800 hover:text-ink-200 transition-colors disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="mt-4">
            {upload.phase === 'idle' && (
              <div>
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                    isDragOver
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-white/10 bg-charcoal-850/50 hover:border-amber-500/40 hover:bg-charcoal-800/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-7 w-7" />
                  </div>

                  <p className="mt-4 font-display text-sm font-semibold text-ink-200 group-hover:text-amber-300 transition-colors">
                    Click to browse or drag and drop your PDF here
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Supports PDF documents up to 10 MB in size
                  </p>

                  <div className="mt-5 flex items-center gap-3 text-[11px] text-ink-400 font-mono">
                    <span className="rounded bg-charcoal-800 px-2 py-1 border border-white/5">PDF format</span>
                    <span className="rounded bg-charcoal-800 px-2 py-1 border border-white/5">Local ONNX Embedding</span>
                    <span className="rounded bg-charcoal-800 px-2 py-1 border border-white/5">MongoDB Atlas</span>
                  </div>
                </div>
              </div>
            )}

            {(upload.phase === 'uploading' || upload.phase === 'indexing') && (
              <div className="rounded-xl border border-white/10 bg-charcoal-850/60 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-display text-sm font-semibold text-ink-100">
                        {upload.fileName || 'Document'}
                      </p>
                      <span className="font-mono text-xs text-amber-400">
                        {upload.phase === 'uploading' ? `${Math.round(upload.progress)}%` : 'Vectorizing'}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-charcoal-800">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-gold-400"
                        initial={{ width: '0%' }}
                        animate={{
                          width: upload.phase === 'uploading' ? `${upload.progress}%` : '100%',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pipeline Steps checklist */}
                <div className="mt-6 space-y-2.5 border-t border-white/5 pt-4">
                  {STAGES.map((stage, idx) => {
                    const isDone =
                      upload.phase === 'indexing' && idx < 4;
                    const isCurrent =
                      (upload.phase === 'uploading' && idx === 0) ||
                      (upload.phase === 'indexing' && idx >= 1);

                    return (
                      <div
                        key={stage.key}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                          isCurrent
                            ? 'border border-amber-500/20 bg-amber-500/5 text-amber-300'
                            : isDone
                            ? 'text-ink-300'
                            : 'text-ink-600'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
                        ) : (
                          <div className="h-4 w-4 shrink-0 rounded-full border border-ink-700" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{stage.label}</p>
                          <p className="text-[10px] text-ink-500">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {upload.phase === 'success' && upload.result && (
              <div className="flex flex-col items-center rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <h4 className="mt-3 font-display text-base font-bold text-ink-100">
                  Document Successfully Vectorized
                </h4>
                <p className="mt-1 text-xs text-ink-400">
                  {upload.result.doc_name} is now indexed in your vector database.
                </p>

                {/* Metrics Stats */}
                <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-sm">
                  <div className="rounded-lg border border-white/5 bg-charcoal-850 p-2.5">
                    <p className="text-data text-[10px] uppercase text-ink-500">Pages</p>
                    <p className="font-mono text-sm font-bold text-amber-400">
                      {upload.result.page_count}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-charcoal-850 p-2.5">
                    <p className="text-data text-[10px] uppercase text-ink-500">Chunks</p>
                    <p className="font-mono text-sm font-bold text-emerald-400">
                      {upload.result.chunk_count}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-charcoal-850 p-2.5">
                    <p className="text-data text-[10px] uppercase text-ink-500">Latency</p>
                    <p className="font-mono text-sm font-bold text-ink-200">
                      {Math.round(upload.result.execution_time_ms)}ms
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetUpload();
                      setSelectedFile(null);
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-charcoal-800 py-2.5 text-xs font-semibold text-ink-200 hover:bg-charcoal-750 transition-colors"
                  >
                    Upload Another
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-amber-primary flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold"
                  >
                    <span>Start Chatting</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {upload.phase === 'error' && (
              <div className="flex flex-col items-center rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <h4 className="mt-3 font-display text-base font-bold text-ink-100">
                  Upload & Ingestion Failed
                </h4>
                <p className="mt-1.5 max-w-sm text-xs text-red-300">
                  {upload.error || 'An unexpected error occurred while processing the document.'}
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetUpload();
                      setSelectedFile(null);
                    }}
                    className="btn-amber-primary rounded-xl px-5 py-2.5 text-xs font-semibold"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-white/10 bg-charcoal-800 px-5 py-2.5 text-xs font-semibold text-ink-200 hover:bg-charcoal-750 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
