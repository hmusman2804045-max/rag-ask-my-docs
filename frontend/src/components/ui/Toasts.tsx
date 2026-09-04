import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const TONE = {
  success: {
    icon: CheckCircle2,
    ring: 'border-champagne-500/30',
    color: 'text-champagne-400',
  },
  error: {
    icon: AlertTriangle,
    ring: 'border-rose-500/30',
    color: 'text-rose-300',
  },
  info: {
    icon: Info,
    ring: 'border-amethyst-400/30',
    color: 'text-amethyst-300',
  },
} as const;

export function Toasts() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[22rem] max-w-[calc(100vw-3rem)] flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = TONE[toast.tone];
          const Icon = tone.icon;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={cn('glass pointer-events-auto rounded-xl border p-3.5', tone.ring)}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.color)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-100">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-1 break-words text-xs leading-relaxed text-ink-400">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-md p-1 text-ink-500 transition-colors hover:bg-white/5 hover:text-ink-100"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
