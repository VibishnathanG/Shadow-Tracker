'use client';

import React, { useState, useMemo } from 'react';
import { Lucide } from '@/components/icons';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Helper to render inline formatting (bold, italic, strikethrough, code, links, images)
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let keyCounter = 0;

  // Pattern matches:
  // 1. Image: !\[(.*?)\]\((.*?)\)
  // 2. Link: \[(.*?)\]\((.*?)\)
  // 3. Inline code: `([^`]+)`
  // 4. Bold: \*\*(.*?)\*\* or __(.*?)__
  // 5. Strikethrough: ~~(.*?)~~
  // 6. Italic: \*(.*?)\* or _(.*?)_
  const inlineRegex = /(!?\[(.*?)\]\((.*?)\))|(`([^`]+)`)|(\*\*(.*?)\*\*)|(__(.*?)__)|(~~(.*?)~~)|(\*(.*?)\*)|(_(.*?)_)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      nodes.push(
        <React.Fragment key={`text-${keyCounter++}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }

    const fullMatch = match[0];

    if (fullMatch.startsWith('![') && match[3]) {
      // Image
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`img-${keyCounter++}`}
          src={match[3]}
          alt={match[2] || ''}
          className="max-w-full h-auto rounded-xl border border-border/80 my-3 shadow-md inline-block"
          loading="lazy"
        />
      );
    } else if (fullMatch.startsWith('[') && match[3]) {
      // Link
      nodes.push(
        <a
          key={`link-${keyCounter++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 transition-opacity hover:opacity-80"
        >
          <span>{match[2]}</span>
          <Lucide.ExternalLink size={12} className="inline opacity-70" />
        </a>
      );
    } else if (match[5] !== undefined) {
      // Inline code
      nodes.push(
        <code
          key={`code-${keyCounter++}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20"
        >
          {match[5]}
        </code>
      );
    } else if (match[7] !== undefined || match[9] !== undefined) {
      // Bold (** or __)
      const boldText = match[7] !== undefined ? match[7] : match[9];
      nodes.push(
        <strong key={`bold-${keyCounter++}`} className="font-extrabold text-foreground">
          {boldText}
        </strong>
      );
    } else if (match[11] !== undefined) {
      // Strikethrough
      nodes.push(
        <del key={`del-${keyCounter++}`} className="line-through text-muted-foreground opacity-75">
          {match[11]}
        </del>
      );
    } else if (match[13] !== undefined || match[15] !== undefined) {
      // Italic (* or _)
      const italicText = match[13] !== undefined ? match[13] : match[15];
      nodes.push(
        <em key={`italic-${keyCounter++}`} className="italic text-foreground/90">
          {italicText}
        </em>
      );
    }

    lastIndex = inlineRegex.lastIndex;
  }

  // Push remainder
  if (lastIndex < text.length) {
    nodes.push(
      <React.Fragment key={`text-${keyCounter++}`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return nodes.length > 0 ? nodes : [text];
}

// Code block with copy button component
const CodeBlockItem: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-4 rounded-2xl overflow-hidden border border-border/80 bg-slate-950/90 text-slate-100 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10 text-xs font-mono">
        <span className="text-slate-400 font-bold uppercase tracking-wider">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all text-xs font-medium cursor-pointer"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Lucide.Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Lucide.Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar font-mono text-xs sm:text-sm leading-relaxed text-emerald-300/90">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const renderedElements = useMemo(() => {
    if (!content || !content.trim()) {
      return null;
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let elementKey = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code Blocks (```)
      if (line.trim().startsWith('```')) {
        const langMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
        const language = langMatch ? langMatch[1] : '';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <CodeBlockItem
            key={`code-block-${elementKey++}`}
            code={codeLines.join('\n')}
            language={language}
          />
        );
        continue;
      }

      // 2. Headings (# to ######)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const inlineText = renderInline(text);

        switch (level) {
          case 1:
            elements.push(
              <h1
                key={`h1-${elementKey++}`}
                className="text-2xl sm:text-3xl font-black text-foreground border-b border-border/60 pb-2.5 mt-6 mb-3 first:mt-0 tracking-tight"
              >
                {inlineText}
              </h1>
            );
            break;
          case 2:
            elements.push(
              <h2
                key={`h2-${elementKey++}`}
                className="text-xl sm:text-2xl font-extrabold text-foreground border-b border-border/40 pb-2 mt-5 mb-2.5 first:mt-0 tracking-tight"
              >
                {inlineText}
              </h2>
            );
            break;
          case 3:
            elements.push(
              <h3
                key={`h3-${elementKey++}`}
                className="text-lg sm:text-xl font-bold text-foreground mt-4 mb-2 first:mt-0 tracking-tight"
              >
                {inlineText}
              </h3>
            );
            break;
          case 4:
            elements.push(
              <h4
                key={`h4-${elementKey++}`}
                className="text-base sm:text-lg font-bold text-foreground mt-3 mb-1.5 first:mt-0 tracking-tight"
              >
                {inlineText}
              </h4>
            );
            break;
          case 5:
            elements.push(
              <h5
                key={`h5-${elementKey++}`}
                className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1 first:mt-0"
              >
                {inlineText}
              </h5>
            );
            break;
          case 6:
            elements.push(
              <h6
                key={`h6-${elementKey++}`}
                className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-2 mb-1 first:mt-0"
              >
                {inlineText}
              </h6>
            );
            break;
        }
        i++;
        continue;
      }

      // 3. Horizontal Rules (--- or *** or ___)
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        elements.push(
          <hr key={`hr-${elementKey++}`} className="my-6 border-t border-border/70" />
        );
        i++;
        continue;
      }

      // 4. Blockquotes (> ...)
      if (line.trim().startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        elements.push(
          <blockquote
            key={`blockquote-${elementKey++}`}
            className="border-l-4 border-primary bg-primary/5 pl-4 pr-3 py-2.5 my-3.5 rounded-r-2xl italic text-foreground/90 font-medium space-y-1 shadow-xs"
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={`quote-line-${qIdx}`} className="leading-relaxed">
                {renderInline(ql)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // 5. Tables (| col 1 | col 2 | ...)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map(c => c.trim());

          const headerCells = parseRow(tableLines[0]);
          // Check if row 1 is delimiter (|---|---|)
          const hasDelimiter = /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableLines[1]);
          const bodyRows = hasDelimiter ? tableLines.slice(2) : tableLines.slice(1);

          elements.push(
            <div key={`table-${elementKey++}`} className="my-4 overflow-x-auto rounded-2xl border border-border/80 shadow-sm backdrop-blur-md">
              <table className="min-w-full text-sm border-collapse text-left">
                <thead className="bg-secondary/60 text-foreground font-bold border-b border-border/80">
                  <tr>
                    {headerCells.map((h, hIdx) => (
                      <th key={`th-${hIdx}`} className="px-4 py-3 font-extrabold tracking-tight">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {bodyRows.map((r, rIdx) => {
                    const cells = parseRow(r);
                    return (
                      <tr key={`tr-${rIdx}`} className="even:bg-secondary/20 hover:bg-secondary/40 transition-colors">
                        {cells.map((c, cIdx) => (
                          <td key={`td-${cIdx}`} className="px-4 py-2.5 text-foreground/90 font-medium">
                            {renderInline(c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 6. Task lists / Checklists (- [ ] or - [x])
      const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
      if (taskMatch) {
        const isChecked = taskMatch[2].toLowerCase() === 'x';
        const taskText = taskMatch[3];
        elements.push(
          <div
            key={`task-${elementKey++}`}
            className="flex items-start gap-2.5 my-1.5 pl-1 group text-sm leading-relaxed"
          >
            <span
              className={`shrink-0 mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                isChecked
                  ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                  : 'border-border/80 bg-secondary/40 text-transparent group-hover:border-primary/60'
              }`}
            >
              <Lucide.Check size={11} strokeWidth={3} className={isChecked ? 'opacity-100' : 'opacity-0'} />
            </span>
            <span className={`text-foreground font-medium ${isChecked ? 'line-through text-muted-foreground opacity-75' : ''}`}>
              {renderInline(taskText)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // 7. Unordered Lists (- item, * item, + item)
      const listMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (listMatch) {
        const listItems: string[] = [];
        while (
          i < lines.length &&
          lines[i].match(/^(\s*)[-*+]\s+(.*)$/) &&
          !lines[i].match(/^(\s*)[-*+]\s+\[([ xX])\]\s+/)
        ) {
          const match = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
          if (match) listItems.push(match[2]);
          i++;
        }
        elements.push(
          <ul key={`ul-${elementKey++}`} className="space-y-1.5 my-2.5 pl-2">
            {listItems.map((item, itemIdx) => (
              <li key={`li-${itemIdx}`} className="flex items-start gap-2.5 text-sm text-foreground/90 font-medium leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block mt-2 shrink-0 shadow-xs" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 8. Ordered Lists (1. item, 2. item)
      const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        const listItems: { num: string; text: string }[] = [];
        while (i < lines.length && lines[i].match(/^(\s*)(\d+)\.\s+(.*)$/)) {
          const match = lines[i].match(/^(\s*)(\d+)\.\s+(.*)$/);
          if (match) listItems.push({ num: match[2], text: match[3] });
          i++;
        }
        elements.push(
          <ol key={`ol-${elementKey++}`} className="space-y-2 my-2.5 pl-1">
            {listItems.map((item, itemIdx) => (
              <li key={`oli-${itemIdx}`} className="flex items-start gap-2.5 text-sm text-foreground/90 font-medium leading-relaxed">
                <span className="shrink-0 text-xs font-black px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground border border-border/60 min-w-[22px] text-center">
                  {item.num}
                </span>
                <span className="mt-0.5">{renderInline(item.text)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 9. Blank Lines
      if (!line.trim()) {
        i++;
        continue;
      }

      // 10. Paragraphs
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].match(/^(#{1,6})\s+/) &&
        !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim()) &&
        !lines[i].trim().startsWith('>') &&
        !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
        !lines[i].match(/^(\s*)[-*+]\s+/) &&
        !lines[i].match(/^(\s*)(\d+)\.\s+/)
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }

      elements.push(
        <p key={`p-${elementKey++}`} className="my-2.5 text-sm sm:text-base leading-relaxed text-foreground/90 font-medium">
          {renderInline(paragraphLines.join(' '))}
        </p>
      );
    }

    return elements;
  }, [content]);

  if (!content || !content.trim()) {
    return (
      <div className={`text-muted-foreground/70 italic text-sm py-8 text-center flex flex-col items-center justify-center gap-2 ${className}`}>
        <Lucide.FileText size={24} className="opacity-40" />
        <span>No content to display in reading view.</span>
      </div>
    );
  }

  return (
    <div className={`prose-container max-w-none text-foreground select-text ${className}`}>
      {renderedElements}
    </div>
  );
};

export default MarkdownRenderer;
