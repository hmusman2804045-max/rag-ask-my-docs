import { motion } from 'framer-motion';
import { UploadCloud, FileText, Cpu, Database, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const CAPABILITY_PILLS = [
  { icon: FileText, label: 'PDF Only · Max 10 MB' },
  { icon: Cpu, label: 'Text Extraction & Chunking' },
  { icon: Database, label: 'FastEmbed 384d Vectors' },
  { icon: Sparkles, label: 'LLaMA 3.3 70B RAG' },
];

export function KnowledgeBaseEmpty() {
  const setUploadModalOpen = useAppStore((state) => state.setUploadModalOpen);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="card-premium relative max-w-2xl overflow-hidden rounded-2xl p-8 sm:p-10"
      >
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Icon Emblem */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-[0_0_24px_rgba(245,166,35,0.2)]">
          <UploadCloud className="h-8 w-8 text-amber-400" />
        </div>

        {/* Heading */}
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">
          Your Knowledge Base is Empty
        </h2>

        {/* Description */}
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-400">
          Upload PDF documents to unlock AI-powered semantic search, instant contextual answers, and precise citations with source verification.
        </p>

        {/* Primary CTA Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="btn-amber-primary flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold tracking-wide shadow-lg shadow-amber-500/20"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Your First PDF
          </button>
        </div>

        {/* Capability Pills */}
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CAPABILITY_PILLS.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-charcoal-850/60 px-3 py-2 text-left text-xs text-ink-300 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                <span className="truncate font-mono text-[11px]">{pill.label}</span>
              </div>
            );
          })}
        </div>

        {/* Trust Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-ink-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Local ONNX vector pipeline · Zero telemetry on document content</span>
        </div>
      </motion.div>
    </div>
  );
}
