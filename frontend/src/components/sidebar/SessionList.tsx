import { Eraser, MessagesSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatRelativeTime } from '@/lib/utils';

export function SessionList() {
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const createSession = useAppStore((state) => state.createSession);
  const selectSession = useAppStore((state) => state.selectSession);
  const clearActiveSession = useAppStore((state) => state.clearActiveSession);
  const messageCount = useAppStore((state) => state.messages.length);

  // Active sessions that have actual messages or user interactions
  const activeSessions = sessions.filter((s) => s.messageCount > 0);
  const ordered = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const hasHistory = activeSessions.length > 0 || messageCount > 0;

  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748B]">
          Recent Sessions
        </span>
        <div className="flex items-center gap-1">
          {hasHistory && (
            <button
              type="button"
              onClick={() => void clearActiveSession()}
              disabled={messageCount === 0}
              className="rounded-md p-1 text-[#64748B] transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Clear active session history"
              title="Clear active session history"
            >
              <Eraser className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={createSession}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-amber-primary transition-colors hover:bg-amber-500/10"
            aria-label="Start a new session"
            title="New session"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {!hasHistory ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0E13]/50 p-3 text-center">
            <p className="text-xs text-[#94A3B8]">No chat history yet</p>
          </div>
        ) : (
          ordered.map((session) => {
            const isActive = session.id === activeSessionId;

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => void selectSession(session.id)}
                className={cn(
                  'relative w-full rounded-xl border p-2.5 text-left transition-all duration-200',
                  isActive
                    ? 'border-amber-primary/40 bg-[#151A22] text-white shadow-[0_0_12px_rgba(245,166,35,0.12)]'
                    : 'border-white/[0.07] bg-[#11151C] text-[#94A3B8] hover:border-amber-primary/20 hover:bg-[#151A22] hover:text-white',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-session-indicator"
                    className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-amber-primary shadow-[0_0_8px_rgba(245,166,35,0.8)]"
                  />
                )}

                <div className="flex items-center gap-2 pl-1.5">
                  <MessagesSquare
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors',
                      isActive ? 'text-amber-primary' : 'text-[#64748B]',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs',
                        isActive ? 'font-semibold text-white' : 'text-[#94A3B8]',
                      )}
                    >
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-data text-[10px] text-[#64748B]">
                      {formatRelativeTime(session.updatedAt)}
                      {session.messageCount > 0 && ` · ${session.messageCount} msgs`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
