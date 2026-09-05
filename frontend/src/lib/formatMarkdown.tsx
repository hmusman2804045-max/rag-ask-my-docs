import React from 'react';

/**
 * Formats basic Markdown elements (**bold**, *italic*, `code`, bullet lists, paragraphs)
 * into rich, high-contrast JSX elements.
 */
export function renderFormattedContent(text: string): React.ReactNode {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n');

        // Check if paragraph is a list
        const isList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim()));

        if (isList) {
          return (
            <ul key={pIdx} className="my-1.5 space-y-1.5 pl-4 list-disc marker:text-champagne-400">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim().replace(/^[-*]\s+|\d+\.\s+/, '');
                return (
                  <li key={lIdx} className="text-slate-100">
                    {parseInlineMarkdown(cleanLine)}
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed text-slate-100">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex to match **bold**, *italic*, `code`, and ++highlight++
  const regex = /(\*\*.*?\*\*|\+\+.*?\+\+|\*.*?\*|`.*?`)/g;
  const tokens = text.split(regex);

  tokens.forEach((token, index) => {
    if (!token) return;

    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      parts.push(
        <strong key={index} className="font-bold text-champagne-300">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('++') && token.endsWith('++') && token.length > 4) {
      parts.push(
        <span key={index} className="font-semibold text-gold-300">
          {token.slice(2, -2)}
        </span>,
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      parts.push(
        <em key={index} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      parts.push(
        <code key={index} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-champagne-200">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(token);
    }
  });

  return parts;
}
