import { ChevronDown, FileText, Layers, MessagesSquare, PanelLeft, Sparkles, User } from 'lucide-react';
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

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);

  return (
    <header className="relative z-30 flex h-[64px] sm:h-[76px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0B0E13]/95 px-3 sm:px-5 backdrop-blur-xl">
      {/* Left: Mobile Sidebar Toggle + Brand Logo & Title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg border border-white/[0.08] bg-[#11151C] p-1.5 sm:p-2 text-[#94A3B8] transition-colors hover:border-amber-primary/40 hover:text-amber-primary lg:hidden"
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {/* Geometric Gold Logo Emblem */}
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-primary/40 bg-gradient-to-br from-amber-500/20 via-[#11151C] to-[#080A0D] shadow-[0_0_16px_rgba(245,166,35,0.2)]">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-primary" />
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            {/* Title: ASKMYDOCS in White, AI in Amber */}
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-sm sm:text-base font-extrabold tracking-tight text-white">
                ASKMYDOCS
              </span>
              <span className="font-display text-sm sm:text-base font-extrabold text-amber-primary">
                AI
              </span>
            </div>
            {/* Tagline: Shown on sm+ screens, strictly single line */}
            <p className="mt-1 hidden whitespace-nowrap font-mono text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#64748B] sm:block">
              Retrieval-Augmented Document Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right: Header Stats, User Avatar & Health Badges */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Metric Dividers (Desktop Only) */}
        <div className="hidden items-center gap-5 lg:flex">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-[#64748B]" />
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">Documents</span>
              <span className="text-data text-xs font-semibold text-white">{documents.length}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#64748B]" />
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">Chunks</span>
              <span className="text-data text-xs font-semibold text-white">{formatNumber(totalChunks)}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <MessagesSquare className="h-3.5 w-3.5 text-[#64748B]" />
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">Conversations</span>
              <span className="text-data text-xs font-semibold text-white">{sessions.length}</span>
            </div>
          </div>
        </div>

        <div className="hidden h-4 w-px bg-white/10 lg:block" />

        {/* User Pill (Tablet / Desktop) */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#11151C]/70 px-2.5 py-1.5 text-xs text-[#94A3B8]">
          <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-primary/30 bg-amber-500/10 text-amber-primary">
            <User className="h-2.5 w-2.5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-[#080A0D] bg-[#22C55E]" />
          </div>
          <span className="whitespace-nowrap font-mono text-[10.5px] font-medium text-white">
            user_teogorw2
          </span>
          <ChevronDown className="h-3 w-3 text-[#64748B]" />
        </div>

        {/* System Badges */}
        <HealthBadge />
      </div>
    </header>
  );
}
