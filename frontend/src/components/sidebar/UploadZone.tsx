import { useCallback, useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, UploadCloud } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Metric, SectionLabel } from '@/components/ui/Primitives';
import { cn, formatNumber, truncateMiddle } from '@/lib/utils';

const PHASE_COPY: Record<string, string> = {
  uploading: 'Transferring bytes',
  indexing: 'Extract › chunk › embed › index',
};

export function UploadZone() {
  const upload = useAppStore((state) => state.upload);
  const uploadDocument = useAppStore((state) => state.uploadDocument);
  const resetUpload = useAppStore((state) => state.resetUpload);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = upload.phase === 'uploading' || upload.phase === 'indexing';

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) void uploadDocument(file);
    },
    [uploadDocument],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) handleFiles(event.dataTransfer.files);
  };

  return (
    <section>
      <SectionLabel className="px-1">Document ingestion</SectionLabel>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !busy) inputRef.current?.click();
        }}
        className={cn(
          'group relative mt-3 cursor-pointer overflow-hidden rounded-2xl border border-dashed p-5 transition-all duration-300',
          dragging
            ? 'border-champagne-400/70 bg-champagne-500/[0.07]'
            : 'border-gold-500/30 bg-white/[0.02] hover:border-gold-400/60 hover:bg-gold-500/[0.06]',
          busy && 'cursor-wait',
        )}
      >
        {/* The scanning laser line mirrors the beam sweeping the 3D codex. */}
        {(busy || dragging) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="shimmer-line h-px w-full animate-scan-sweep" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          <div
            className={cn(
              'grid h-12 w-12 place-items-center rounded-xl border transition-colors',
              busy
                ? 'border-champagne-500/40 bg-champagne-500/10'
                : 'border-gold-400/30 bg-gold-500/10 group-hover:border-champagne-500/40',
            )}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin text-champagne-400" />
            ) : (
              <UploadCloud className="h-5 w-5 text-gold-300 transition-colors group-hover:text-champagne-300" />
            )}
          </div>

          <p className="mt-3 text-base font-semibold text-ink-100">
            {busy ? PHASE_COPY[upload.phase] : 'Drop a PDF to index'}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {busy
              ? truncateMiddle(upload.fileName ?? '', 28)
              : 'or click to browse · PDF only · max 10 MB'}
          </p>

          {busy && (
            <div className="mt-4 w-full">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 to-champagne-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: upload.phase === 'indexing' ? '100%' : `${upload.progress}%`,
                  }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
              <p className="mt-2 text-data text-xs text-ink-400">
                {upload.phase === 'indexing'
                  ? 'Server-side vectorisation in progress…'
                  : `${upload.progress}% transferred`}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {upload.phase === 'success' && upload.result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-champagne-500/20 bg-champagne-500/[0.05] p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-champagne-400" />
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-100 sm:text-sm">
                  {upload.result.doc_name}
                </p>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="text-xs uppercase tracking-wider text-ink-400 transition-colors hover:text-champagne-300"
                >
                  Clear
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <Metric label="Pages" value={upload.result.page_count} />
                <Metric label="Chunks" value={upload.result.chunk_count} />
                <Metric label="Chars" value={formatNumber(upload.result.char_count)} />
                <Metric label="ms" value={Math.round(upload.result.execution_time_ms)} />
              </div>
            </div>
          </motion.div>
        )}

        {upload.phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-rose-200">Ingestion failed</p>
                <p className="mt-1 break-words text-xs leading-relaxed text-rose-300/80">
                  {upload.error}
                </p>
              </div>
              <button
                type="button"
                onClick={resetUpload}
                className="text-ink-500 transition-colors hover:text-ink-100"
                aria-label="Dismiss upload error"
              >
                <FileUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
