import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { ChatFeed } from '@/components/chat/ChatFeed';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { DocumentsDashboard } from '@/components/workspace/DocumentsDashboard';
import { KnowledgeBaseEmpty } from '@/components/workspace/KnowledgeBaseEmpty';
import { UploadModal } from '@/components/sidebar/UploadModal';
import { CitationDrawer } from '@/components/inspector/CitationDrawer';
import { Toasts } from '@/components/ui/Toasts';
import { CodexCanvas } from '@/three/CodexCanvas';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const ACTIVITY_COPY: Record<string, string> = {
  idle: 'Neural Codex at rest',
  ingesting: 'Extracting text · Vectorizing ONNX embeddings',
  retrieving: 'Querying MongoDB Atlas vector index',
};

function CodexStage({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const activity = useAppStore((state) => state.activity);
  const documents = useAppStore((state) => state.documents);

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className={cn(
        'card-premium relative overflow-hidden rounded-2xl transition-all duration-300',
        expanded ? 'h-48 sm:h-56' : 'h-24 sm:h-28',
      )}
    >
      {/* Background Engineering Grid */}
      <div className="pointer-events-none absolute inset-0 grid-glow opacity-60" />
      <CodexCanvas />

      {/* Top and Bottom Gradient Scrims */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-charcoal-950/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-charcoal-950/90 to-transparent" />

      {/* Overlay Status */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
              Document Intelligence Stage
            </p>
          </div>
          <p
            className={cn(
              'mt-0.5 font-mono text-[11px]',
              activity === 'idle' ? 'text-ink-400' : 'text-amber-300 font-medium',
            )}
          >
            {ACTIVITY_COPY[activity]}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="pointer-events-auto rounded-lg border border-white/10 bg-charcoal-900/80 p-1.5 text-ink-400 backdrop-blur-xl transition-colors hover:border-amber-500/40 hover:text-amber-300"
          aria-label={expanded ? 'Collapse 3D Stage' : 'Expand 3D Stage'}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-center font-mono text-[10px] text-ink-500">
        drag to orbit · scroll to zoom · {documents.length} document
        {documents.length === 1 ? '' : 's'} in neural index
      </p>
    </motion.div>
  );
}

export default function App() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const activeTab = useAppStore((state) => state.activeTab);
  const documents = useAppStore((state) => state.documents);
  const messages = useAppStore((state) => state.messages);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [stageExpanded, setStageExpanded] = useState(true);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Poll health so the badge reflects the backend state
  useEffect(() => {
    const timer = window.setInterval(() => void useAppStore.getState().fetchHealth(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-charcoal-950 text-ink-100">
      {/* TopBar */}
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Main 3-Zone Workspace */}
      <main className="grid min-h-0 flex-1 gap-4 px-4 pb-4 lg:grid-cols-[18.5rem_minmax(0,1fr)] xl:grid-cols-[18.5rem_minmax(0,1fr)_20rem]">
        {/* Left Column: Sidebar */}
        <div className="hidden min-h-0 lg:block">
          <Sidebar />
        </div>

        {/* Mobile Left Sidebar Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-charcoal-950/75 backdrop-blur-[3px] lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                className="fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)] p-3 lg:hidden"
              >
                <Sidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Center Column: Interactive Workspace */}
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {activeTab === 'documents' ? (
            <div className="card-premium flex min-h-0 flex-1 flex-col rounded-2xl overflow-hidden">
              <DocumentsDashboard />
            </div>
          ) : (
            <>
              {/* 3D Visualizer Stage */}
              <CodexStage
                expanded={stageExpanded}
                onToggle={() => setStageExpanded((value) => !value)}
              />

              {/* Chat Feed or Empty State */}
              <div className="card-premium flex min-h-[12rem] flex-1 flex-col rounded-2xl p-4 overflow-hidden shadow-inner shadow-black/20">
                {documents.length === 0 && messages.length === 0 ? (
                  <KnowledgeBaseEmpty />
                ) : (
                  <ChatFeed />
                )}
              </div>

              {/* Bottom Chat Composer */}
              <ChatComposer />
            </>
          )}
        </section>

        {/* Right Column: Knowledge Base Metrics & Status (Visible on xl screens or toggleable) */}
        <div className={cn('hidden min-h-0 xl:block', !rightPanelOpen && 'xl:hidden')}>
          <RightPanel />
        </div>
      </main>

      {/* Global Modals & Overlays */}
      <UploadModal />
      <CitationDrawer />
      <Toasts />
    </div>
  );
}
