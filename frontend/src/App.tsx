import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatFeed } from '@/components/chat/ChatFeed';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { CitationDrawer } from '@/components/inspector/CitationDrawer';
import { Toasts } from '@/components/ui/Toasts';
import { CodexCanvas } from '@/three/CodexCanvas';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const ACTIVITY_COPY: Record<string, string> = {
  idle: 'Codex at rest',
  ingesting: 'Scanning · vectorising document',
  retrieving: 'Detangling context chunks',
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
        'glass relative overflow-hidden rounded-2xl',
        expanded ? 'h-[min(44vh,21rem)]' : 'h-[min(22vh,10rem)]',
      )}
    >
      {/* The canvas sits inside a faint engineering grid rather than on flat black. */}
      <div className="pointer-events-none absolute inset-0 grid-glow" />
      <CodexCanvas />

      {/* Readability scrim so overlay chrome never fights the scene. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-titanium-900/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-titanium-900/80 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            Quantum codex
          </p>
          <p
            className={cn(
              'mt-1 text-data text-[11px]',
              activity === 'idle' ? 'text-ink-400' : 'text-champagne-300',
            )}
          >
            {ACTIVITY_COPY[activity]}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="pointer-events-auto rounded-lg border border-white/10 bg-titanium-900/60 p-2 text-ink-400 backdrop-blur-xl transition-colors hover:border-champagne-500/40 hover:text-champagne-300"
          aria-label={expanded ? 'Collapse the 3D stage' : 'Expand the 3D stage'}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-center text-data text-[10px] text-ink-500">
        drag to orbit · scroll to zoom · {documents.length} doc-node
        {documents.length === 1 ? '' : 's'} in orbit
      </p>
    </motion.div>
  );
}

export default function App() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stageExpanded, setStageExpanded] = useState(true);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Poll health so the badge reflects the backend going up or down mid-session.
  useEffect(() => {
    const timer = window.setInterval(() => void useAppStore.getState().fetchHealth(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <main className="grid min-h-0 flex-1 gap-4 px-5 pb-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 lg:block">
          <Sidebar />
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-titanium-950/60 backdrop-blur-[2px] lg:hidden"
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

        <section className="flex min-h-0 flex-col gap-4">
          <CodexStage
            expanded={stageExpanded}
            onToggle={() => setStageExpanded((value) => !value)}
          />

          <div className="glass flex min-h-[11rem] flex-1 flex-col rounded-2xl p-4">
            <ChatFeed />
          </div>

          <ChatComposer />
        </section>
      </main>

      <CitationDrawer />
      <Toasts />
    </div>
  );
}
