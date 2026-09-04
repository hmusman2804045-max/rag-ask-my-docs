import { Eraser, MessagesSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { SectionLabel } from '@/components/ui/Primitives';
import { cn, formatRelativeTime } from '@/lib/utils';

export function SessionList() {
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const createSession = useAppStore((state) => state.createSession);
  const selectSession = useAppStore((state) => state.selectSession);
  const clearActiveSession = useAppStore((state) => state.clearActiveSession);
  const messageCount = useAppStore((state) => state.messages.length);

  const ordered = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between px-1">
        <SectionLabel>Conversation sessions</SectionLabel>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void clearActiveSession()}
            disabled={messageCount === 0}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/5 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Clear the active session history"
            title="Clear active session history"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={createSession}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/5 hover:text-champagne-300"
            aria-label="Start a new session"
            title="New session"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="scrollbar-thin mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
        {ordered.map((session) => {
          const isActive = session.id === activeSessionId;

          return (
            <button
              key={session.id}
              type="button"
              onClick={() => void selectSession(session.id)}
              className={cn(
                'relative w-full rounded-xl border p-2.5 text-left transition-all duration-200',
                isActive
                  ? 'border-amethyst-400/40 bg-amethyst-500/10'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="active-session"
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-champagne-400 to-amethyst-400"
                />
              )}

              <div className="flex items-center gap-2 pl-1.5">
                <MessagesSquare
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    isActive ? 'text-champagne-400' : 'text-ink-500',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-xs',
                      isActive ? 'font-medium text-ink-100' : 'text-ink-300',
                    )}
                  >
                    {session.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-500">
                    {formatRelativeTime(session.updatedAt)}
                    {session.messageCount > 0 && ` · ${session.messageCount} msgs`}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
