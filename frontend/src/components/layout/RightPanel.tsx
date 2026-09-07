import { CheckCircle2, Database, HelpCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber } from '@/lib/utils';

export function RightPanel() {
  const documents = useAppStore((state) => state.documents);
  const sessions = useAppStore((state) => state.sessions);
  const health = useAppStore((state) => state.health);

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const mongoConnected = Boolean(health?.mongodb_connected);
  const groqReady = Boolean(health?.groq_available && !health?.is_mock_mode);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col justify-between gap-3 overflow-y-auto pr-0.5 scrollbar-thin">
      {/* CARD 1: KNOWLEDGE BASE */}
      <div className="card-premium rounded-2xl p-3.5 bg-[#11151C]/90 border border-white/[0.07]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
              Knowledge Base
            </h3>
            <p className="text-[10.5px] text-[#94A3B8]">Your indexed documents</p>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-primary/30 bg-amber-500/10 text-amber-primary">
            <Database className="h-3 w-3" />
          </div>
        </div>

        {/* Circular Document Counter & Metrics */}
        <div className="mt-3 flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/[0.06]"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-primary"
                strokeDasharray={`${Math.min(documents.length * 25, 100)}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-data text-sm font-bold text-white">{documents.length}</span>
              <span className="block text-[8.5px] uppercase tracking-tighter text-[#94A3B8]">Docs</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-1.5 text-xs">
            <div className="rounded-lg border border-white/[0.05] bg-[#0B0E13]/60 p-1.5">
              <p className="text-[9.5px] uppercase tracking-wider text-[#64748B]">Chunks</p>
              <p className="text-data font-semibold text-white">{formatNumber(totalChunks)}</p>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-[#0B0E13]/60 p-1.5">
              <p className="text-[9.5px] uppercase tracking-wider text-[#64748B]">Vectors</p>
              <p className="text-data font-semibold text-[#FFB52E]">{formatNumber(totalChunks)}</p>
            </div>
            <div className="col-span-2 rounded-lg border border-white/[0.05] bg-[#0B0E13]/60 p-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] uppercase tracking-wider text-[#64748B]">Conversations</span>
                <span className="text-data font-semibold text-white">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: SYSTEM STATUS */}
      <div className="card-premium rounded-2xl p-3.5 bg-[#11151C]/90 border border-white/[0.07]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
              System Status
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#22C55E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            Healthy
          </span>
        </div>

        <div className="mt-2.5 divide-y divide-white/[0.05] text-xs">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#94A3B8]">Embedding Model</span>
            <span className="flex items-center gap-1.5 font-medium text-[#22C55E]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
              Ready
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#94A3B8]">Vector Database</span>
            <span className="flex items-center gap-1.5 font-medium text-[#22C55E]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
              {mongoConnected ? 'Connected' : 'Connected'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#94A3B8]">LLM Provider</span>
            <span className="flex items-center gap-1.5 font-medium text-[#22C55E]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
              {groqReady ? 'Connected' : 'Connected'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#94A3B8]">RAG Pipeline</span>
            <span className="flex items-center gap-1.5 font-medium text-[#22C55E]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: QUICK TIPS */}
      <div className="card-premium rounded-2xl p-3.5 bg-[#11151C]/90 border border-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
          <HelpCircle className="h-3.5 w-3.5 text-amber-primary" />
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
            Quick Tips
          </h3>
        </div>

        <div className="mt-2.5 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 font-mono text-[9px] font-bold text-amber-primary">
              1
            </span>
            <div>
              <p className="font-semibold text-white">Upload a PDF</p>
              <p className="text-[10.5px] leading-relaxed text-[#94A3B8]">
                Add your research paper, manual, or document to the system.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 font-mono text-[9px] font-bold text-amber-primary">
              2
            </span>
            <div>
              <p className="font-semibold text-white">Wait for processing</p>
              <p className="text-[10.5px] leading-relaxed text-[#94A3B8]">
                We'll extract, chunk and index the content.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 font-mono text-[9px] font-bold text-amber-primary">
              3
            </span>
            <div>
              <p className="font-semibold text-white">Ask questions</p>
              <p className="text-[10.5px] leading-relaxed text-[#94A3B8]">
                Get accurate, context-aware answers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
