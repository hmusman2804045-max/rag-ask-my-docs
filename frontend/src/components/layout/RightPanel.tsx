import { CheckCircle2, Circle, Database, HelpCircle, Layers, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
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
    <aside className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto pr-0.5 scrollbar-thin">
      {/* CARD 1: KNOWLEDGE BASE OVERVIEW */}
      <div className="card-premium rounded-2xl p-4 transition-all hover:border-card-border-active">
        <div className="flex items-center justify-between border-b border-card-border pb-3">
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-primary">
              Knowledge Base
            </h3>
            <p className="text-[11px] text-ink-muted">Your indexed documents</p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-primary/30 bg-amber-500/10 text-amber-primary">
            <Database className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Circular Indicator & Metrics Grid */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
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
              <span className="text-data text-base font-bold text-ink-primary">{documents.length}</span>
              <span className="block text-[9px] uppercase tracking-tighter text-ink-muted">Docs</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/[0.05] bg-bg-secondary/50 p-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Chunks</p>
              <p className="text-data font-semibold text-ink-primary">{formatNumber(totalChunks)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-bg-secondary/50 p-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Vectors</p>
              <p className="text-data font-semibold text-amber-bright">{formatNumber(totalChunks)}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/[0.05] bg-bg-secondary/50 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">Conversations</span>
                <span className="text-data font-semibold text-ink-primary">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: SYSTEM STATUS */}
      <div className="card-premium rounded-2xl p-4 transition-all hover:border-card-border-active">
        <div className="flex items-center justify-between border-b border-card-border pb-3">
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-primary">
              System Status
            </h3>
            <p className="text-[11px] text-ink-muted">Pipeline health & connections</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Healthy
          </span>
        </div>

        <div className="mt-3 divide-y divide-white/[0.05] text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-ink-secondary">Embedding Model</span>
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Ready
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-ink-secondary">Vector Database</span>
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {mongoConnected ? 'Connected' : 'In-Memory Fallback'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-ink-secondary">LLM Provider</span>
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {groqReady ? 'Connected' : 'Ready'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-ink-secondary">RAG Pipeline</span>
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: QUICK TIPS */}
      <div className="card-premium rounded-2xl p-4 transition-all hover:border-card-border-active">
        <div className="flex items-center gap-2 border-b border-card-border pb-3">
          <HelpCircle className="h-4 w-4 text-amber-primary" />
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-primary">
            Quick Tips
          </h3>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 font-mono text-[10px] font-bold text-amber-primary">
              1
            </span>
            <div>
              <p className="font-semibold text-ink-primary">Upload a PDF</p>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Add your research paper, manual, or document to the system.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 font-mono text-[10px] font-bold text-amber-primary">
              2
            </span>
            <div>
              <p className="font-semibold text-ink-primary">Wait for processing</p>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                We'll extract, chunk, and embed the content into vector space.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 font-mono text-[10px] font-bold text-amber-primary">
              3
            </span>
            <div>
              <p className="font-semibold text-ink-primary">Ask questions</p>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Get accurate, context-aware answers with verified inline citations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
