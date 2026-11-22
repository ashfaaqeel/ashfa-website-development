import { useEffect } from 'react';
import type { SiteContent } from '@workspace/api-client-react';
import { ColorField } from '@/components/admin/color-field';
import {
  DEFAULT_BODY_SIZE,
  DEFAULT_HEADING_SIZE,
  FONT_OPTIONS,
  appearanceStyle,
  ensureFontsLoaded,
  legacyFontFor,
  resolveBodyFont,
  resolveHeadingFont,
  type Appearance,
  type FontCategory,
} from '@/lib/appearance';

type Props = { content: SiteContent; change: (next: SiteContent) => void };

const GROUPS: { category: FontCategory; label: string }[] = [
  { category: 'sans', label: 'Sans serif' },
  { category: 'serif', label: 'Serif' },
  { category: 'mono', label: 'Monospace' },
];

function FontSelect({ id, label, value, onChange, testId }: { id: string; label: string; value: string; onChange: (key: string) => void; testId: string }) {
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId}>
        {GROUPS.map((group) => (
          <optgroup key={group.category} label={group.label}>
            {FONT_OPTIONS.filter((font) => font.category === group.category).map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function AppearancePanel({ content, change }: Props) {
  const appearance = content.appearance;
  const update = (patch: Partial<Appearance>) => change({ ...content, appearance: { ...appearance, ...patch } });
  const unset = (...keys: (keyof Appearance)[]) => {
    const next = { ...appearance };
    for (const key of keys) delete next[key];
    change({ ...content, appearance: next });
  };
  const body = resolveBodyFont(appearance);
  const heading = resolveHeadingFont(appearance);
  const headingSize = appearance.headingSize ?? DEFAULT_HEADING_SIZE;
  const bodySize = appearance.bodySize ?? DEFAULT_BODY_SIZE;

  useEffect(() => { ensureFontsLoaded([body, heading]); }, [body, heading]);

  return (
    <section className="admin-panel" data-testid="panel-appearance">
      <h2 className="admin-section-title">Appearance</h2>
      <p className="admin-hint">Typography and colour for every public page. Changes apply after “Save changes”.</p>

      <h3 className="admin-section-title admin-subtitle">Type</h3>
      <div className="admin-grid">
        <FontSelect id="appearance-heading-font" label="Heading font" value={heading.key} onChange={(key) => update({ headingFont: key })} testId="select-appearance-heading-font" />
        <FontSelect id="appearance-body-font" label="Body font" value={body.key} onChange={(key) => { const font = FONT_OPTIONS.find((item) => item.key === key); update({ bodyFont: key, ...(font ? { font: legacyFontFor(font) } : {}) }); }} testId="select-appearance-body-font" />
        <div className="admin-field"><label htmlFor="appearance-heading-size">Heading size · {headingSize}px</label><input id="appearance-heading-size" type="range" min="16" max="64" step="1" value={headingSize} onChange={(e) => update({ headingSize: Number(e.target.value) })} data-testid="input-appearance-heading-size" /></div>
        <div className="admin-field"><label htmlFor="appearance-body-size">Body size · {bodySize}px</label><input id="appearance-body-size" type="range" min="10" max="24" step="1" value={bodySize} onChange={(e) => update({ bodySize: Number(e.target.value) })} data-testid="input-appearance-body-size" /></div>
      </div>

      <h3 className="admin-section-title admin-subtitle">Colour</h3>
      <div className="admin-grid">
        <ColorField label="Background color" value={appearance.backgroundColor} testId="input-appearance-background" onChange={(backgroundColor) => update({ backgroundColor })} />
        <ColorField label="Body text color" value={appearance.textColor} testId="input-appearance-text" onChange={(textColor) => update({ textColor })} />
        <ColorField label="Heading color" value={appearance.headingColor ?? appearance.textColor} testId="input-appearance-heading-color" onChange={(headingColor) => update({ headingColor })} onReset={appearance.headingColor ? () => unset('headingColor') : undefined} />
        <ColorField label="Link color" value={appearance.linkColor ?? appearance.accentColor} testId="input-appearance-link-color" onChange={(linkColor) => update({ linkColor })} onReset={appearance.linkColor ? () => unset('linkColor') : undefined} />
        <ColorField label="Accent color" value={appearance.accentColor} testId="input-appearance-accent" onChange={(accentColor) => update({ accentColor })} />
        <div className="admin-field"><label htmlFor="appearance-width">Content width · {appearance.contentWidth}px</label><input id="appearance-width" type="range" min="480" max="1000" step="10" value={appearance.contentWidth} onChange={(e) => update({ contentWidth: Number(e.target.value) })} data-testid="input-appearance-width" /></div>
        <div className="admin-field"><label htmlFor="appearance-align">Text alignment</label><select id="appearance-align" value={appearance.textAlign ?? 'left'} onChange={(e) => update({ textAlign: e.target.value as Appearance['textAlign'] })}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></div>
        <div className="admin-field"><label htmlFor="appearance-section-spacing">Section spacing · {appearance.sectionSpacing ?? 53}px</label><input id="appearance-section-spacing" type="range" min="8" max="160" value={appearance.sectionSpacing ?? 53} onChange={(e) => update({ sectionSpacing: Number(e.target.value) })} /></div>
        <div className="admin-field"><label htmlFor="appearance-image-width">Image max width · {appearance.imageMaxWidth ?? appearance.contentWidth}px</label><input id="appearance-image-width" type="range" min="40" max="1000" value={appearance.imageMaxWidth ?? appearance.contentWidth} onChange={(e) => update({ imageMaxWidth: Number(e.target.value) })} /></div>
        <ColorField label="Link hover color" value={appearance.linkHoverColor ?? appearance.linkColor ?? appearance.accentColor} testId="input-appearance-link-hover" onChange={(linkHoverColor) => update({ linkHoverColor })} />
        <ColorField label="Border color" value={appearance.borderColor ?? '#e4e3dd'} testId="input-appearance-border" onChange={(borderColor) => update({ borderColor })} />
      </div>
      <div className="admin-actions"><button type="button" className="admin-button" onClick={() => unset('headingFont', 'bodyFont', 'headingSize', 'bodySize', 'headingColor', 'linkColor')} data-testid="button-appearance-reset">Reset type and colours to defaults</button></div>

      <div className="admin-preview admin-appearance-preview" style={{ ...appearanceStyle(appearance), backgroundColor: appearance.backgroundColor, color: appearance.textColor, maxWidth: appearance.contentWidth, fontFamily: 'var(--app-font-sans)' }} data-testid="preview-appearance">
        <p className="admin-eyebrow">Preview</p>
        <h3 className="page-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--heading-size)', color: 'var(--heading-color, var(--ink))' }}>A little change in tone.</h3>
        <p className="prose-copy">This is how the site’s type and colour come together, with a <a href="#preview" onClick={(event) => event.preventDefault()}>link inside the text</a>.</p>
      </div>
    </section>
  );
}
