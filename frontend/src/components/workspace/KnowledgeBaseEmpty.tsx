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
    <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-4 sm:pb-6 px-3 sm:px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* Heading */}
        <h2 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-white">
          Your Knowledge Base is Empty
        </h2>

        {/* Description */}
        <p className="mx-auto mt-1 max-w-sm sm:max-w-md text-[11px] sm:text-sm leading-relaxed text-[#94A3B8]">
          Upload a PDF to get started. Ask questions, get accurate answers, and explore your documents with AI.
        </p>

        {/* Primary Large Amber/Gold CTA Button */}
        <div className="mt-3 sm:mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="btn-amber-primary flex items-center gap-2 rounded-xl px-5 sm:px-6 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#080A0D] shadow-[0_0_20px_rgba(245,166,35,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UploadCloud className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Upload Your First PDF
          </button>
        </div>

        {/* 4 Horizontal/Grid Capability Pills */}
        <div className="mt-3.5 sm:mt-5 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2">
          {CAPABILITY_PILLS.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-center sm:justify-start gap-1.5 rounded-lg border border-white/[0.07] bg-[#0B0E13]/85 px-2 py-1 sm:px-2.5 sm:py-1 text-xs text-[#94A3B8] backdrop-blur-md"
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-amber-primary" />
                <span className="truncate font-mono text-[9.5px] sm:text-[10.5px] text-[#F5F7FA]">
                  {pill.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
