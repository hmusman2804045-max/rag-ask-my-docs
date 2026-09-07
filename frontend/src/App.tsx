import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
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

export default function App() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const activeTab = useAppStore((state) => state.activeTab);
  const documents = useAppStore((state) => state.documents);
  const messages = useAppStore((state) => state.messages);
  const activity = useAppStore((state) => state.activity);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stageExpanded, setStageExpanded] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Poll health periodically
  useEffect(() => {
    const timer = window.setInterval(() => void useAppStore.getState().fetchHealth(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen max-h-screen w-screen flex-col overflow-hidden bg-[#080A0D] text-[#F5F7FA]">
      {/* TopBar (Header: 76px) */}
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Main 3-Column Workspace (Fixed 100vh viewport) */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 p-3.5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px] overflow-hidden">
        {/* Left Column: Sidebar (300px) */}
        <div className="hidden min-h-0 lg:block h-full">
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
                className="fixed inset-0 z-40 bg-[#080A0D]/80 backdrop-blur-[3px] lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                className="fixed inset-y-0 left-0 z-50 w-[min(300px,90vw)] p-3 lg:hidden"
              >
                <Sidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Center Column: Primary Knowledge/Visualization Workspace & Chat */}
        <section className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden h-full">
          {activeTab === 'documents' ? (
            <div className="card-premium flex min-h-0 flex-1 flex-col rounded-2xl overflow-hidden bg-[#11151C]/90 border border-white/[0.07]">
              <DocumentsDashboard />
            </div>
          ) : (
            <>
              {/* Central Knowledge / 3D Visualization Area */}
              <div className="card-premium relative flex min-h-0 flex-1 flex-col rounded-2xl overflow-hidden bg-[#11151C]/90 border border-white/[0.07]">
                {/* 3D Scene Canvas Background Layer */}
                <div className="absolute inset-0 z-0">
                  <div className="pointer-events-none absolute inset-0 grid-glow opacity-40" />
                  <CodexCanvas />
                  {/* Subtle top & bottom gradient fades */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#080A0D]/70 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B0E13]/90 via-[#0B0E13]/60 to-transparent" />
                </div>

                {/* Top Stage Header Overlay */}
                <div className="relative z-20 flex items-start justify-between p-4 pointer-events-none">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-primary animate-pulse" />
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-primary">
                        Document Intelligence Stage
                      </p>
                    </div>
                    <p
                      className={cn(
                        'mt-0.5 font-mono text-[11px]',
                        activity === 'idle' ? 'text-[#94A3B8]' : 'text-amber-primary font-medium',
                      )}
                    >
                      {ACTIVITY_COPY[activity]}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStageExpanded((v) => !v)}
                    className="pointer-events-auto rounded-lg border border-white/10 bg-[#0B0E13]/80 p-1.5 text-[#94A3B8] backdrop-blur-xl transition-colors hover:border-amber-primary/40 hover:text-amber-primary"
                    aria-label={stageExpanded ? 'Collapse 3D Stage' : 'Expand 3D Stage'}
                  >
                    {stageExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Main Content Area (Empty State or Live Chat Messages) */}
                <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
                  {documents.length === 0 && messages.length === 0 ? (
                    <KnowledgeBaseEmpty />
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col p-4 overflow-hidden">
                      <ChatFeed />
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Composer (Shrink-0 at bottom, always visible) */}
              <ChatComposer />
            </>
          )}
        </section>

        {/* Right Column: Knowledge Base Metrics, System Status & Quick Tips (320px) */}
        <div className="hidden min-h-0 xl:block h-full">
          <RightPanel />
        </div>
      </main>

      {/* Global Modals & Notifications */}
      <UploadModal />
      <CitationDrawer />
      <Toasts />
    </div>
  );
}
