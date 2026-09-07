import { motion } from 'framer-motion';
import { Cpu, Database, FileText, Sparkles, UploadCloud } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const CAPABILITY_PILLS = [
  { icon: FileText, label: 'PDF Only · Max 10 MB' },
  { icon: Cpu, label: 'Text Extraction & Chunking' },
  { icon: Database, label: 'Embeddings & Indexing' },
  { icon: Sparkles, label: 'Semantic Search & RAG' },
];

export function KnowledgeBaseEmpty() {
  const setUploadModalOpen = useAppStore((state) => state.setUploadModalOpen);

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-6 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-xl"
      >
        {/* Heading */}
        <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
          Your Knowledge Base is Empty
        </h2>

        {/* Description */}
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#94A3B8] sm:text-sm">
          Upload a PDF to get started. Ask questions, get accurate answers, and explore your documents with AI.
        </p>

        {/* Primary Large Amber/Gold CTA Button */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="btn-amber-primary flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080A0D] shadow-[0_0_24px_rgba(245,166,35,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Your First PDF
          </button>
        </div>

        {/* 4 Horizontal Capability Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {CAPABILITY_PILLS.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[#0B0E13]/80 px-2.5 py-1 text-xs text-[#94A3B8] backdrop-blur-md"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-amber-primary" />
                <span className="font-mono text-[10.5px] text-[#F5F7FA]">{pill.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
