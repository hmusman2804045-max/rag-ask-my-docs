import { FileText, History, Home, Layers, Plus, Settings, Sparkles, UploadCloud } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DocumentList } from './DocumentList';
import { SessionList } from './SessionList';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setUploadModalOpen = useAppStore((state) => state.setUploadModalOpen);
  const health = useAppStore((state) => state.health);

  const isOnline = Boolean(health);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'Chat History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="card-premium flex h-full min-h-0 w-full flex-col justify-between rounded-2xl p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'border border-amber-primary/30 bg-card-hover text-ink-primary shadow-amber-glow'
                    : 'border border-transparent text-ink-secondary hover:bg-white/[0.03] hover:text-ink-primary',
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-amber-primary shadow-amber-glow" />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-amber-primary' : 'text-ink-muted',
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="h-px w-full bg-white/[0.06]" />

        {/* Scrollable Document & Session Lists */}
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
          <DocumentList onOpenUpload={() => setUploadModalOpen(true)} />
          <div className="h-px w-full bg-white/[0.06]" />
          <SessionList />
        </div>
      </div>

      {/* Bottom: System Online Status Badge */}
      <div className="mt-4 shrink-0 border-t border-card-border pt-3">
        <div className="flex items-center justify-between rounded-xl border border-card-border bg-bg-secondary/60 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ink-primary">
                System Online
              </p>
              <p className="text-data text-[11px] text-ink-muted">
                RAG Pipeline · Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-primary/30 bg-amber-500/10 text-amber-primary transition-all hover:border-amber-primary hover:bg-amber-primary hover:text-bg-primary hover:shadow-amber-glow"
            title="Upload PDF"
            aria-label="Upload PDF"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
