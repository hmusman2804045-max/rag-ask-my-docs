import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('glass rounded-2xl', className)} {...props}>
      {children}
    </div>
  ),
);
GlassPanel.displayName = 'GlassPanel';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'gold';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-gold-500 to-gold-300 text-titanium-950 shadow-gold hover:from-champagne-400 hover:to-champagne-300',
  gold: 'bg-gradient-to-r from-champagne-500 to-champagne-400 text-titanium-900 shadow-gold hover:from-champagne-400 hover:to-champagne-300',
  ghost:
    'border border-white/10 bg-white/[0.03] text-ink-300 hover:border-gold-400/40 hover:bg-gold-500/10 hover:text-ink-100',
  danger:
    'border border-rose-500/25 bg-rose-500/10 text-rose-200 hover:border-rose-400/50 hover:bg-rose-500/20',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({
  variant = 'ghost',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-inherit',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-400',
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
      <p className="text-data text-sm font-semibold text-champagne-300">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}

/** Similarity bar: amber for the base score, pale champagne once a match is strong. */
export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const percent = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/5', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          percent >= 70
            ? 'bg-gradient-to-r from-gold-400 to-champagne-300'
            : 'bg-gradient-to-r from-gold-600 to-gold-400',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
