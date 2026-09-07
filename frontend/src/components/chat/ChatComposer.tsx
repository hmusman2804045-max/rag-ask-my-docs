import { useRef, useState, type KeyboardEvent } from 'react';
import { Layers, Loader2, Send, History, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const MAX_QUESTION_LENGTH = 2000;

const SUGGESTIONS = [
  'Summarize this document',
  'What are the key findings and conclusions?',
  'Explain the methodology used',
];

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
    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-charcoal-800/80 px-2 py-1 text-xs backdrop-blur-sm">
      <Icon className="h-3 w-3 text-amber-400" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="px-1 font-mono text-ink-400 transition-colors hover:text-amber-300 disabled:opacity-30"
        aria-label={`Decrease ${label}`}
      >
        –
      </button>
      <span className="w-4 text-center font-mono text-xs font-bold text-amber-400">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="px-1 font-mono text-ink-400 transition-colors hover:text-amber-300 disabled:opacity-30"
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

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Suggestion Chips */}
      {documents.length > 0 && value.length === 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="flex items-center gap-1 text-[11px] font-medium text-ink-500">
            <Sparkles className="h-3 w-3 text-amber-400/70" />
            <span>Suggested:</span>
          </span>
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="rounded-lg border border-white/5 bg-charcoal-850/80 px-2.5 py-1 text-[11px] text-ink-300 transition-all hover:border-amber-500/40 hover:bg-charcoal-800 hover:text-amber-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="card-premium relative rounded-2xl p-3 shadow-lg shadow-black/40">
        <div className="flex items-end gap-3">
          <div className="mb-2 hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>

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
                ? 'Upload a PDF document first, then ask anything…'
                : 'Ask your documents anything… (e.g. key findings, summaries)'
            }
            className="max-h-44 min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm font-normal text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />

          {/* Circular Amber Send Button */}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
              canSend
                ? 'bg-gradient-to-r from-amber-500 via-gold-400 to-amber-500 text-charcoal-950 shadow-md shadow-amber-500/30 hover:scale-105 active:scale-95'
                : 'cursor-not-allowed border border-white/5 bg-charcoal-800 text-ink-600',
            )}
            aria-label="Send question"
          >
            {isAnswering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 fill-current translate-x-px" />
            )}
          </button>
        </div>

        {/* Bottom Parameter Controls */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5">
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

          <p className="font-mono text-[11px] text-ink-500">
            {value.length > 0 && `${value.length}/${MAX_QUESTION_LENGTH} · `}
            <span>Enter to send · Shift+Enter for new line</span>
          </p>
        </div>
      </div>
    </div>
  );
}
