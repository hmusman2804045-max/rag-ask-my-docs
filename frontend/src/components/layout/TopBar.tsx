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
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-card-border bg-bg-secondary/80 px-4 backdrop-blur-xl sm:px-6">
      {/* Left: Brand & Title */}
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
          {/* Geometric Gold Logo */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-primary/40 bg-gradient-to-br from-amber-500/20 via-card to-bg-primary shadow-amber-glow">
            <div className="absolute inset-0 rounded-xl bg-amber-primary/5" />
            <Sparkles className="h-4 w-4 text-amber-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-sm font-bold tracking-tight text-ink-primary sm:text-base">
                ASKMYDOCS
              </span>
              <span className="font-display text-sm font-bold text-amber-primary sm:text-base">
                AI
              </span>
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-[11px]">
              Retrieval-Augmented Document Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right: Subtle Header Stats & User Profile */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Subtle Stats Pills */}
        <div className="hidden items-center gap-5 md:flex">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-ink-muted" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Documents</span>
              <span className="text-data text-xs font-semibold text-ink-primary">{documents.length}</span>
            </div>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-ink-muted" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Chunks</span>
              <span className="text-data text-xs font-semibold text-ink-primary">{formatNumber(totalChunks)}</span>
            </div>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <MessagesSquare className="h-3.5 w-3.5 text-ink-muted" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Conversations</span>
              <span className="text-data text-xs font-semibold text-ink-primary">{sessions.length}</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        {/* User Avatar & Online Status */}
        <div className="flex items-center gap-2.5 rounded-lg border border-card-border bg-card/60 px-2.5 py-1.5 text-xs text-ink-secondary">
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 text-amber-primary">
            <User className="h-3 w-3" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-bg-primary bg-success" />
          </div>
          <span className="hidden font-mono text-[11px] font-medium text-ink-primary sm:inline">
            user_teogorw2
          </span>
          <ChevronDown className="h-3 w-3 text-ink-muted" />
        </div>

        <HealthBadge />
      </div>
    </header>
  );
}
