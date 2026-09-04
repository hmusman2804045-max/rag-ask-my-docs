import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Database, HardDrive, RefreshCw, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

function StatusDot({ ok, pending }: { ok: boolean; pending?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {ok && !pending && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
      )}
      <span
        className={cn(
          'relative inline-flex h-2 w-2 rounded-full',
          pending ? 'bg-ink-500' : ok ? 'bg-emerald-400' : 'bg-rose-400',
        )}
      />
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-2">
      <span className="flex items-center gap-2 text-xs text-ink-400">
        <Icon className="h-3.5 w-3.5 text-amethyst-300" />
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-[11px]',
          ok ? 'text-emerald-300' : 'text-champagne-400',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function HealthBadge() {
  const health = useAppStore((state) => state.health);
  const healthError = useAppStore((state) => state.healthError);
  const isLoading = useAppStore((state) => state.isHealthLoading);
  const fetchHealth = useAppStore((state) => state.fetchHealth);
  const [open, setOpen] = useState(false);

  const online = Boolean(health) && !healthError;
  const liveMode = Boolean(health && !health.is_mock_mode);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(
            'glass flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs transition-colors',
            online ? 'hover:border-amethyst-400/40' : 'border-rose-500/30 hover:border-rose-400/50',
          )}
        >
          <StatusDot ok={online} pending={isLoading && !health} />
          <span className="font-medium text-ink-100">
            {online ? 'System healthy' : isLoading ? 'Checking…' : 'API offline'}
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
              liveMode
                ? 'bg-champagne-500/15 text-champagne-300'
                : 'bg-amethyst-500/20 text-amethyst-300',
            )}
          >
            {liveMode ? 'Groq live' : 'Mock'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void fetchHealth()}
          className="glass rounded-full p-2 text-ink-400 transition-colors hover:text-champagne-300"
          aria-label="Refresh system health"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="glass absolute right-0 top-12 z-40 w-80 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                Service topology
              </p>
              <span className="font-mono text-[10px] text-ink-500">{API_BASE_URL}</span>
            </div>

            <div className="my-3 h-px w-full gold-divider" />

            {health ? (
              <div className="divide-y divide-white/5">
                <DetailRow
                  icon={Database}
                  label="MongoDB Atlas"
                  value={health.mongodb_connected ? 'connected' : 'in-memory fallback'}
                  ok={health.mongodb_connected}
                />
                <DetailRow
                  icon={HardDrive}
                  label="Chroma vector store"
                  value={health.chroma_status}
                  ok={health.chroma_status.startsWith('healthy')}
                />
                <DetailRow
                  icon={Sparkles}
                  label="Groq LLM"
                  value={
                    health.is_mock_mode
                      ? 'mock generation'
                      : health.groq_available
                        ? 'live inference'
                        : 'sdk missing'
                  }
                  ok={!health.is_mock_mode}
                />
                <DetailRow
                  icon={Activity}
                  label="API status"
                  value={health.status}
                  ok={health.status === 'healthy'}
                />
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-rose-300">
                {healthError ?? 'Waiting for the first health response…'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
