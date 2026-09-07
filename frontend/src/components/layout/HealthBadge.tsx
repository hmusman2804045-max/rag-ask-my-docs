import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Database, HardDrive, RefreshCw, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { API_BASE_URL } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';

type Tone = 'ok' | 'warn' | 'down' | 'pending';

/** `chroma_status` arrives as "healthy (N vectors indexed)". */
function parseVectorCount(status: string | undefined): number | null {
  const match = status?.match(/(\d+)\s+vectors/);
  return match ? Number(match[1]) : null;
}

function StatusDot({ tone }: { tone: Tone }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      {tone === 'ok' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
      )}
      <span
        className={cn(
          'relative inline-flex h-1.5 w-1.5 rounded-full',
          tone === 'ok' && 'bg-success',
          tone === 'warn' && 'bg-amber-primary',
          tone === 'down' && 'bg-rose-500',
          tone === 'pending' && 'bg-ink-muted',
        )}
      />
    </span>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs',
        tone === 'ok' && 'border-success/30 bg-success/10 text-success',
        tone === 'warn' && 'border-amber-primary/30 bg-amber-primary/10 text-amber-primary',
        tone === 'down' && 'border-rose-500/30 bg-rose-500/10 text-rose-400',
        tone === 'pending' && 'border-white/10 bg-white/[0.02] text-ink-muted',
      )}
    >
      <StatusDot tone={tone} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</span>
      <span className="text-data font-medium">{value}</span>
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
        <Icon className="h-3.5 w-3.5 text-gold-400" />
        {label}
      </span>
      <span className={cn('text-data text-[11px]', ok ? 'text-emerald-300' : 'text-champagne-300')}>
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
  const vectorCount = parseVectorCount(health?.chroma_status);

  const mongoTone: Tone = !online ? 'down' : health?.mongodb_connected ? 'ok' : 'warn';
  const chromaTone: Tone = !online ? 'down' : 'ok';
  const groqTone: Tone = !online ? 'down' : liveMode ? 'ok' : 'warn';

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Full status pills once the header has room for them. */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="System health details"
          className="hidden items-center gap-1.5 rounded-full border border-card-border bg-card/60 px-2 py-1 transition-colors hover:border-amber-primary/40 md:flex"
        >
          <Pill
            label="Mongo"
            value={!online ? 'offline' : health?.mongodb_connected ? 'atlas' : 'fallback'}
            tone={mongoTone}
          />
          <Pill
            label="Vector"
            value={vectorCount === null ? '—' : `${formatNumber(vectorCount)} vec`}
            tone={chromaTone}
          />
          <Pill
            label="Groq"
            value={!online ? 'offline' : liveMode ? 'live' : 'mock'}
            tone={groqTone}
          />
        </button>

        {/* Compact summary on narrow screens. */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(
            'flex items-center gap-2 rounded-full border border-card-border bg-card/60 px-3 py-1.5 text-xs transition-colors md:hidden',
            online ? 'hover:border-amber-primary/40' : 'border-rose-500/30',
          )}
        >
          <StatusDot tone={online ? 'ok' : isLoading ? 'pending' : 'down'} />
          <span
            className={cn(
              'text-data text-[10px] font-semibold uppercase tracking-wider',
              liveMode ? 'text-amber-bright' : 'text-amber-primary',
            )}
          >
            {online ? (liveMode ? 'Groq live' : 'Mock') : 'Offline'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void fetchHealth()}
          className="rounded-full border border-card-border bg-card/60 p-2 text-ink-muted transition-colors hover:border-amber-primary/40 hover:text-amber-primary"
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
            className="card-premium absolute right-0 top-12 z-40 w-80 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-card-border pb-2.5">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-amber-primary">
                Service Topology
              </p>
              <span className="text-data text-[10px] text-ink-muted">{API_BASE_URL || 'production root'}</span>
            </div>

            {health ? (
              <div className="mt-2 divide-y divide-white/5">
                <DetailRow
                  icon={Database}
                  label="MongoDB Atlas"
                  value={health.mongodb_connected ? 'Connected' : 'In-memory fallback'}
                  ok={health.mongodb_connected}
                />
                <DetailRow
                  icon={HardDrive}
                  label="Vector Index"
                  value={health.chroma_status}
                  ok={health.chroma_status.startsWith('healthy')}
                />
                <DetailRow
                  icon={Sparkles}
                  label="Groq LLaMA 3.3"
                  value={
                    health.is_mock_mode
                      ? 'Mock mode'
                      : health.groq_available
                        ? 'Connected (LPU)'
                        : 'SDK unavailable'
                  }
                  ok={!health.is_mock_mode}
                />
                <DetailRow
                  icon={Activity}
                  label="FastAPI Status"
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
