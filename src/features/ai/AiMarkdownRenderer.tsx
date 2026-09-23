'use client';

import React from 'react';

interface AiMarkdownRendererProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

// Parses inline markdown tokens: **bold**, __bold__, `code`, *italic*, _italic_
function renderInline(text: string, isUser = false): React.ReactNode[] {
  if (!text) return [];

  // Match bold (** or __), inline code (`), and italic (* or _)
  const tokenRegex = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`]+`|\*[^\*\n]+?\*|_[^_\n]+?_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold (**text** or __text__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className={`font-black ${isUser ? 'text-primary-foreground' : 'text-foreground'}`}
        >
          {inner}
        </strong>
      );
    }

    // Inline code (`code`)
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] font-bold ${
            isUser
              ? 'bg-black/25 text-white border border-white/20'
              : 'bg-muted/80 text-primary border border-border/50'
          }`}
        >
          {inner}
        </code>
      );
    }

    // Italic (*text* or _text_)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic opacity-90">
          {inner}
        </em>
      );
    }

    // Normal text
    return <span key={idx}>{part}</span>;
  });
}

export const AiMarkdownRenderer: React.FC<AiMarkdownRendererProps> = ({
  content,
  isUser = false,
  className = '',
}) => {
  if (!content) return null;

  // Split into raw lines while preserving code block sections
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code block fence (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const codeContent = codeBlockLines.join('\n');
        elements.push(
          <div
            key={`code-${i}`}
            className="my-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 overflow-hidden font-mono text-xs shadow-inner"
          >
            {codeBlockLang && (
              <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-[11.5px] leading-relaxed scrollbar-thin">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty lines -> vertical spacer
    if (trimmed === '') {
      elements.push(<div key={`space-${i}`} className="h-2" />);
      continue;
    }

    // Horizontal Rule (--- or ***)
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          className={`my-2 border-t ${isUser ? 'border-primary-foreground/30' : 'border-border/60'}`}
        />
      );
      continue;
    }

    // Tables (| col 1 | col 2 |)
    if (trimmed.startsWith('|') && i + 1 < lines.length) {
      const nextTrimmed = lines[i + 1].trim();
      const isSeparator = /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(nextTrimmed);
      if (isSeparator) {
        const parseRow = (rowStr: string) => {
          let s = rowStr.trim();
          if (s.startsWith('|')) s = s.slice(1);
          if (s.endsWith('|')) s = s.slice(0, -1);
          return s.split('|').map((c) => c.trim());
        };

        const headers = parseRow(trimmed);
        const rows: string[][] = [];
        let rIndex = i + 2;

        while (rIndex < lines.length) {
          const rLine = lines[rIndex].trim();
          if (!rLine.startsWith('|') || rLine === '') break;
          rows.push(parseRow(rLine));
          rIndex++;
        }

        elements.push(
          <div
            key={`table-${i}`}
            className="my-2.5 overflow-x-auto rounded-xl border border-border/80 bg-surface/60 shadow-xs scrollbar-thin"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/70 text-foreground font-black border-b border-border/80">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-3 py-2 border-r last:border-r-0 border-border/50 text-[11.5px] uppercase tracking-wider font-extrabold"
                    >
                      {renderInline(h, isUser)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 py-1.5 border-r last:border-r-0 border-border/40 text-foreground/90 font-medium"
                      >
                        {renderInline(cell, isUser)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        i = rIndex - 1;
        continue;
      }
    }

    // Headings (###, ##, #)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className={`font-black text-xs sm:text-sm tracking-tight mt-2.5 mb-1 ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {renderInline(trimmed.slice(4), isUser)}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className={`font-black text-sm sm:text-base tracking-tight mt-3 mb-1.5 ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {renderInline(trimmed.slice(3), isUser)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className={`font-black text-base sm:text-lg tracking-tight mt-3 mb-1.5 ${
            isUser ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {renderInline(trimmed.slice(2), isUser)}
        </h2>
      );
      continue;
    }

    // Blockquote (> )
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className={`pl-3 my-1.5 border-l-2 text-xs italic ${
            isUser
              ? 'border-primary-foreground/50 opacity-90'
              : 'border-primary/60 text-muted-foreground'
          }`}
        >
          {renderInline(trimmed.slice(2), isUser)}
        </blockquote>
      );
      continue;
    }

    // Bullet List Items (- , * , + , • )
    const bulletMatch = rawLine.match(/^(\s*)([-*+•])\s+(.*)$/);
    if (bulletMatch) {
      const indentLevel = Math.min(Math.floor(bulletMatch[1].length / 2), 3);
      const textContent = bulletMatch[3];
      elements.push(
        <div
          key={`bullet-${i}`}
          className={`flex items-start gap-2 my-1 leading-snug ${
            indentLevel > 0 ? `ml-${indentLevel * 3}` : ''
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
              isUser ? 'bg-primary-foreground' : 'bg-primary'
            }`}
          />
          <div className="flex-1 min-w-0">
            {renderInline(textContent, isUser)}
          </div>
        </div>
      );
      continue;
    }

    // Numbered List Items (1. , 2. )
    const numberMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      const numStr = numberMatch[2];
      const textContent = numberMatch[3];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 leading-snug">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono shrink-0 mt-0.5 ${
              isUser
                ? 'bg-black/20 text-primary-foreground'
                : 'bg-primary/15 text-primary'
            }`}
          >
            {numStr}
          </span>
          <div className="flex-1 min-w-0">
            {renderInline(textContent, isUser)}
          </div>
        </div>
      );
      continue;
    }

    // Default: Normal Paragraph Line
    elements.push(
      <p key={`p-${i}`} className="my-0.5 leading-relaxed">
        {renderInline(rawLine, isUser)}
      </p>
    );
  }

  // Handle unclosed code block if response stream stopped abruptly
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div
        key="code-unclosed"
        className="my-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 overflow-hidden font-mono text-xs shadow-inner"
      >
        <pre className="p-3 overflow-x-auto text-[11.5px] leading-relaxed scrollbar-thin">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    );
  }

  return <div className={`ai-markdown-content space-y-0.5 ${className}`}>{elements}</div>;
};
