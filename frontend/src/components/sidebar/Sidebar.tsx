import { FileText, History, Home, Plus, Settings, UploadCloud } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DocumentList } from './DocumentList';
import { SessionList } from './SessionList';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setUploadModalOpen = useAppStore((state) => state.setUploadModalOpen);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'Chat History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="card-premium flex h-full min-h-0 w-full flex-col justify-between rounded-2xl p-3.5 bg-[#11151C]/90 border border-white/[0.07]">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
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
                  'relative flex items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'border border-amber-primary/30 bg-[#151A22] text-white shadow-[0_0_15px_rgba(245,166,35,0.15)]'
                    : 'border border-transparent text-[#94A3B8] hover:bg-white/[0.03] hover:text-white',
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-amber-primary shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-amber-primary' : 'text-[#64748B]',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="h-px w-full bg-white/[0.06]" />

        {/* Scrollable Document & Session Lists */}
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <DocumentList onOpenUpload={() => setUploadModalOpen(true)} />
          <div className="h-px w-full bg-white/[0.06]" />
          <SessionList />
        </div>
      </div>

      {/* Bottom: System Online Status Card */}
      <div className="mt-3 shrink-0 border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0B0E13]/80 px-3 py-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E]/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
            </span>
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                System Online
              </p>
              <p className="text-data text-[11px] text-[#94A3B8]">
                RAG Pipeline · Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-primary/30 bg-amber-500/10 text-amber-primary transition-all hover:border-amber-primary hover:bg-amber-primary hover:text-[#080A0D] shadow-[0_0_10px_rgba(245,166,35,0.2)]"
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
