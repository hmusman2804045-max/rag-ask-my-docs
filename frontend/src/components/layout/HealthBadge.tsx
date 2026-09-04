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
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
      )}
      <span
        className={cn(
          'relative inline-flex h-1.5 w-1.5 rounded-full',
          tone === 'ok' && 'bg-emerald-400',
          tone === 'warn' && 'bg-gold-400',
          tone === 'down' && 'bg-rose-400',
          tone === 'pending' && 'bg-ink-500',
        )}
      />
    </span>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        tone === 'ok' && 'border-emerald-400/25 bg-emerald-400/[0.07]',
        tone === 'warn' && 'border-gold-400/30 bg-gold-500/[0.08]',
        tone === 'down' && 'border-rose-400/30 bg-rose-500/[0.08]',
        tone === 'pending' && 'border-white/10 bg-white/[0.03]',
      )}
    >
      <StatusDot tone={tone} />
      <span className="text-[10px] uppercase tracking-wider text-ink-500">{label}</span>
      <span
        className={cn(
          'text-data text-[11px] font-medium',
          tone === 'ok' && 'text-emerald-300',
          tone === 'warn' && 'text-champagne-300',
          tone === 'down' && 'text-rose-300',
          tone === 'pending' && 'text-ink-400',
        )}
      >
        {value}
      </span>
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
          className="glass hidden items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:border-gold-400/45 md:flex"
        >
          <Pill
            label="Mongo"
            value={!online ? 'offline' : health?.mongodb_connected ? 'atlas' : 'fallback'}
            tone={mongoTone}
          />
          <Pill
            label="Chroma"
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
            'glass flex items-center gap-2 rounded-full px-3 py-2 text-xs transition-colors md:hidden',
            online ? 'hover:border-gold-400/45' : 'border-rose-500/30',
          )}
        >
          <StatusDot tone={online ? 'ok' : isLoading ? 'pending' : 'down'} />
          <span
            className={cn(
              'text-data text-[10px] font-semibold uppercase tracking-wider',
              liveMode ? 'text-champagne-300' : 'text-gold-300',
            )}
          >
            {online ? (liveMode ? 'Groq live' : 'Mock') : 'Offline'}
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
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                Service topology
              </p>
              <span className="text-data text-[10px] text-ink-500">{API_BASE_URL}</span>
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
