import { useId, useRef, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  rows?: number;
};

/** Textarea with Bold / Italic / Link helpers. Everything stays plain Markdown text. */
export function MarkdownTextarea({ label, value, onChange, testId, rows = 6 }: Props) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState('https://');
  const selection = useRef({ start: 0, end: 0 });

  const replaceSelection = (before: string, after: string, fallback: string, start: number, end: number) => {
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const wrap = (mark: string, fallback: string) => {
    const el = area.current;
    replaceSelection(mark, mark, fallback, el?.selectionStart ?? value.length, el?.selectionEnd ?? value.length);
  };

  const openLink = () => {
    const el = area.current;
    selection.current = { start: el?.selectionStart ?? value.length, end: el?.selectionEnd ?? value.length };
    setUrl('https://');
    setLinking(true);
  };

  const applyLink = () => {
    const target = url.trim();
    if (!target || target === 'https://') return;
    const { start, end } = selection.current;
    replaceSelection('[', `](${target})`, 'link text', start, end);
    setLinking(false);
  };

  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <div className="admin-md-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className="admin-button" onClick={() => wrap('**', 'bold text')} data-testid={`${testId}-bold`}>Bold</button>
        <button type="button" className="admin-button" onClick={() => wrap('*', 'italic text')} data-testid={`${testId}-italic`}>Italic</button>
        <button type="button" className="admin-button" onClick={openLink} data-testid={`${testId}-link`}>Link selected text</button>
      </div>
      {linking && (
        <div className="admin-md-link" data-testid={`${testId}-link-form`}>
          <input
            aria-label="Link address"
            value={url}
            autoFocus
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); applyLink(); }
              if (event.key === 'Escape') setLinking(false);
            }}
            data-testid={`${testId}-link-url`}
          />
          <button type="button" className="admin-button primary" onClick={applyLink} data-testid={`${testId}-link-apply`}>Add link</button>
          <button type="button" className="admin-button" onClick={() => setLinking(false)}>Cancel</button>
        </div>
      )}
      <textarea id={id} ref={area} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId} />
      <p className="admin-hint admin-md-hint">Markdown: <code>[words to link](https://example.com)</code>, <code>**bold**</code>, <code>*italic*</code>. Select words, then press “Link selected text”.</p>
    </div>
  );
}
