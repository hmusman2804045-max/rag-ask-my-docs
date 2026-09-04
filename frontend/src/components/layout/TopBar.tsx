import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  const userId = useAppStore((state) => state.userId);

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);

  return (
    <header className="relative z-30 flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="glass rounded-xl p-2.5 text-ink-400 transition-colors hover:text-champagne-300 lg:hidden"
          aria-label={sidebarOpen ? 'Hide document panel' : 'Show document panel'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        <div className="flex min-w-0 items-center gap-3">
          {/* Glowing amber indicator: the system is live. */}
          <span className="relative grid h-9 w-9 shrink-0 place-items-center">
            <span className="absolute inset-0 rounded-xl border border-gold-500/35 bg-gradient-to-br from-gold-500/25 to-gold-700/20" />
            <span className="relative h-2 w-2 animate-glow-dot rounded-full bg-gold-400" />
          </span>

          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold uppercase tracking-wider text-ink-100 sm:text-lg">
              AskMyDocs <span className="text-gradient-gold">AI</span>
            </h1>
            <p className="hidden text-xs uppercase tracking-[0.2em] text-ink-400 sm:block">
              Retrieval-augmented document intelligence
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden items-center gap-4 xl:flex">
          <div className="text-right">
            <p className="text-data text-base font-semibold text-champagne-300">{documents.length}</p>
            <p className="text-[11px] uppercase tracking-wider text-ink-400">Documents</p>
          </div>
          <span className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-data text-base font-semibold text-champagne-300">{formatNumber(totalChunks)}</p>
            <p className="text-[11px] uppercase tracking-wider text-ink-400">Vectors</p>
          </div>
          <span className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-data text-base font-semibold text-ink-200">{userId}</p>
            <p className="text-[11px] uppercase tracking-wider text-ink-400">Identity</p>
          </div>
        </div>

        <HealthBadge />
      </div>
    </header>
  );
}
