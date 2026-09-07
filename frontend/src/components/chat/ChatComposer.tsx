import { useRef, useState, type KeyboardEvent } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const MAX_QUESTION_LENGTH = 2000;

const SUGGESTIONS = [
  'Summarize this document',
  'What are the key findings?',
  'Explain the main concepts',
];

export function ChatComposer() {
  const askQuestion = useAppStore((state) => state.askQuestion);
  const isAnswering = useAppStore((state) => state.isAnswering);

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
    <div className="shrink-0 card-premium rounded-2xl p-2.5 sm:p-3 bg-[#11151C]/95 border border-white/[0.07]">
      {/* Input Row */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Left AI Sparkle Icon */}
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-amber-primary/30 bg-amber-500/10 text-amber-primary">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value.slice(0, MAX_QUESTION_LENGTH));
            const el = event.target;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask your documents anything..."
          className="max-h-28 min-h-[2rem] sm:min-h-[2.25rem] flex-1 resize-none bg-transparent px-1 py-1 text-xs text-white placeholder-[#64748B] focus:outline-none"
        />

        {/* Circular Amber Send Button */}
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className={cn(
            'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200',
            canSend
              ? 'bg-gradient-to-r from-amber-500 via-[#FFB52E] to-amber-500 text-[#080A0D] shadow-[0_0_14px_rgba(245,166,35,0.4)] hover:scale-105 active:scale-95'
              : 'cursor-not-allowed border border-white/[0.06] bg-[#151A22] text-[#64748B]',
          )}
          aria-label="Send question"
        >
          {isAnswering ? (
            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
          ) : (
            <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current translate-x-px" />
          )}
        </button>
      </div>

      {/* Suggestion Chips & Keyboard Hint Row */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-1.5 sm:pt-2 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
          <span className="shrink-0 text-[10px] sm:text-[10.5px] font-medium text-[#64748B]">
            Try asking:
          </span>
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="shrink-0 whitespace-nowrap rounded-lg border border-white/[0.06] bg-[#0B0E13]/60 px-2 py-0.5 text-[10px] sm:text-[10.5px] text-[#94A3B8] transition-all hover:border-amber-primary/40 hover:bg-[#151A22] hover:text-[#FFB52E]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <span className="hidden sm:inline shrink-0 font-mono text-[10px] text-[#64748B]">
          ⌘ Enter to send
        </span>
      </div>
    </div>
  );
}
