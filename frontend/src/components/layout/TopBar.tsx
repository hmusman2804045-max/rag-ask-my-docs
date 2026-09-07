import { ChevronDown, Database, FileText, Layers, MessagesSquare, PanelLeft, Sparkles, User } from 'lucide-react';
import { HealthBadge } from './HealthBadge';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber } from '@/lib/utils';

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const documents = useAppStore((state) => state.documents);
  const sessions = useAppStore((state) => state.sessions);
  const userId = useAppStore((state) => state.userId);

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);

  return (
    <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-card-border bg-[#0B0E13]/90 px-5 backdrop-blur-xl">
      {/* Left: Brand & Tagline */}
      <div className="flex min-w-0 items-center gap-3.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg border border-card-border bg-card p-2 text-ink-secondary transition-colors hover:border-amber-primary/40 hover:text-amber-primary lg:hidden"
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          {/* Geometric Gold Logo Emblem */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-primary/40 bg-gradient-to-br from-amber-500/20 via-[#11151C] to-[#080A0D] shadow-[0_0_16px_rgba(245,166,35,0.2)]">
            <Sparkles className="h-5 w-5 text-amber-primary" />
          </div>

          <div className="flex flex-col justify-center">
            {/* Title: ASKMYDOCS in White, AI in Amber */}
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-base font-extrabold tracking-tight text-white sm:text-lg">
                ASKMYDOCS
              </span>
              <span className="font-display text-base font-extrabold text-amber-primary sm:text-lg">
                AI
              </span>
            </div>
            {/* Tagline: STRICTLY ONE SINGLE LINE */}
            <p className="mt-1 whitespace-nowrap font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Retrieval-Augmented Document Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right: Subtle Header Stats, User Avatar & Health Badges */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Metric Dividers */}
        <div className="hidden items-center gap-5 lg:flex">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-ink-muted" />
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Documents</span>
              <span className="text-data text-xs font-semibold text-white">{documents.length}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-ink-muted" />
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Chunks</span>
              <span className="text-data text-xs font-semibold text-white">{formatNumber(totalChunks)}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <MessagesSquare className="h-3.5 w-3.5 text-ink-muted" />
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Conversations</span>
              <span className="text-data text-xs font-semibold text-white">{sessions.length}</span>
            </div>
          </div>
        </div>

        <div className="hidden h-4 w-px bg-white/10 lg:block" />

        {/* User Pill */}
        <div className="flex items-center gap-2.5 rounded-lg border border-card-border bg-[#11151C]/70 px-2.5 py-1.5 text-xs text-ink-secondary">
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 text-amber-primary">
            <User className="h-3 w-3" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#080A0D] bg-success" />
          </div>
          <span className="hidden whitespace-nowrap font-mono text-[11px] font-medium text-white sm:inline">
            user_teogorw2
          </span>
          <ChevronDown className="h-3 w-3 text-ink-muted" />
        </div>

        {/* System Badges */}
        <HealthBadge />
      </div>
    </header>
  );
}
