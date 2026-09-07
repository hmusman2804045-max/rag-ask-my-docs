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

  const ordered = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">
          Recent Sessions
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void clearActiveSession()}
            disabled={messageCount === 0}
            className="rounded-md p-1 text-ink-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Clear active session history"
            title="Clear active session history"
          >
            <Eraser className="h-3 w-3" />
          </button>
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
        {ordered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border bg-card/40 p-4 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-amber-primary/20 bg-amber-500/10 text-amber-primary">
              <MessagesSquare className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-semibold text-ink-primary">No chat history yet</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              Your conversations will appear here after you start asking questions.
            </p>
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
                    ? 'border-amber-primary/40 bg-card-hover text-ink-primary shadow-amber-glow'
                    : 'border-card-border bg-card/60 text-ink-secondary hover:border-amber-primary/20 hover:bg-card-hover hover:text-ink-primary',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-session-indicator"
                    className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-amber-primary shadow-amber-glow"
                  />
                )}

                <div className="flex items-center gap-2 pl-1.5">
                  <MessagesSquare
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors',
                      isActive ? 'text-amber-primary' : 'text-ink-muted',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs',
                        isActive ? 'font-semibold text-ink-primary' : 'text-ink-secondary',
                      )}
                    >
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-data text-[10px] text-ink-muted">
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
