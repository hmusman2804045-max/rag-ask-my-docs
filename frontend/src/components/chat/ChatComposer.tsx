import { useRef, useState, type KeyboardEvent } from 'react';
import { Layers, Loader2, SendHorizontal, History } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const MAX_QUESTION_LENGTH = 2000;

function Stepper({
  icon: Icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: typeof Layers;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1">
      <Icon className="h-3 w-3 text-amethyst-300" />
      <span className="text-[10px] uppercase tracking-wider text-ink-500">{label}</span>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="px-1 text-ink-400 transition-colors hover:text-champagne-300 disabled:opacity-30"
        aria-label={`Decrease ${label}`}
      >
        –
      </button>
      <span className="w-4 text-center font-mono text-[11px] text-champagne-300">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="px-1 text-ink-400 transition-colors hover:text-champagne-300 disabled:opacity-30"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}

export function ChatComposer() {
  const askQuestion = useAppStore((state) => state.askQuestion);
  const isAnswering = useAppStore((state) => state.isAnswering);
  const nChunks = useAppStore((state) => state.nChunks);
  const maxHistory = useAppStore((state) => state.maxHistory);
  const setNChunks = useAppStore((state) => state.setNChunks);
  const setMaxHistory = useAppStore((state) => state.setMaxHistory);
  const documents = useAppStore((state) => state.documents);

  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isAnswering;

  const submit = () => {
    if (!canSend) return;
    void askQuestion(value);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value.slice(0, MAX_QUESTION_LENGTH));
            const el = event.target;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={
            documents.length === 0
              ? 'Index a PDF first, then ask anything about it…'
              : 'Ask anything about your indexed documents…'
          }
          className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200',
            canSend
              ? 'bg-gradient-to-br from-amethyst-500 to-amethyst-400 text-white shadow-violet hover:from-champagne-500 hover:to-champagne-400 hover:text-obsidian-900'
              : 'cursor-not-allowed border border-white/5 bg-white/[0.02] text-ink-500',
          )}
          aria-label="Send question"
        >
          {isAnswering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Stepper
            icon={Layers}
            label="Chunks"
            value={nChunks}
            min={1}
            max={10}
            onChange={setNChunks}
          />
          <Stepper
            icon={History}
            label="Memory"
            value={maxHistory}
            min={0}
            max={20}
            onChange={setMaxHistory}
          />
        </div>

        <p className="font-mono text-[10px] text-ink-500">
          {value.length > 0 && `${value.length}/${MAX_QUESTION_LENGTH} · `}
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
