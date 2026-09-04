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
    <header className="relative z-30 flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center">
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-amethyst-500 to-amethyst-700 opacity-90" />
            <span className="absolute inset-0 rounded-xl border border-champagne-500/40" />
            <span className="relative font-mono text-sm font-semibold text-champagne-300">A</span>
          </div>

          <div>
            <h1 className="text-[15px] font-semibold leading-tight tracking-tight">
              AskMyDocs <span className="text-gradient-gold">Neural Codex</span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Retrieval-augmented document intelligence
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-4 xl:flex">
          <div className="text-right">
            <p className="font-mono text-sm text-champagne-300">{documents.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Documents</p>
          </div>
          <span className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="font-mono text-sm text-champagne-300">{formatNumber(totalChunks)}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Vectors</p>
          </div>
          <span className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="font-mono text-sm text-ink-300">{userId}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Identity</p>
          </div>
        </div>

        <HealthBadge />
      </div>
    </header>
  );
}
