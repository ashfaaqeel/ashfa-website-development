import type { CSSProperties } from 'react';
import type { SiteContent } from '@workspace/api-client-react';

export type Appearance = SiteContent['appearance'];
export type FontCategory = 'sans' | 'serif' | 'mono';

export type FontOption = {
  key: string;
  label: string;
  category: FontCategory;
  /** CSS font-family stack. */
  stack: string;
  /** Google Fonts "family" query value. Omitted for system fonts and fonts already loaded in index.css. */
  google?: string;
};

export const FONT_OPTIONS: FontOption[] = [
  { key: 'dm-sans', label: 'DM Sans', category: 'sans', stack: "'DM Sans', sans-serif" },
  { key: 'inter', label: 'Inter', category: 'sans', stack: "'Inter', sans-serif", google: 'Inter:wght@400;500;600' },
  { key: 'work-sans', label: 'Work Sans', category: 'sans', stack: "'Work Sans', sans-serif", google: 'Work Sans:wght@400;500;600' },
  { key: 'ibm-plex-sans', label: 'IBM Plex Sans', category: 'sans', stack: "'IBM Plex Sans', sans-serif", google: 'IBM Plex Sans:wght@400;500;600' },
  { key: 'source-sans', label: 'Source Sans 3', category: 'sans', stack: "'Source Sans 3', sans-serif", google: 'Source Sans 3:wght@400;500;600' },
  { key: 'manrope', label: 'Manrope', category: 'sans', stack: "'Manrope', sans-serif", google: 'Manrope:wght@400;500;600' },
  { key: 'instrument-serif', label: 'Instrument Serif', category: 'serif', stack: "'Instrument Serif', Georgia, serif" },
  { key: 'playfair', label: 'Playfair Display', category: 'serif', stack: "'Playfair Display', Georgia, serif", google: 'Playfair Display:wght@400;500;600' },
  { key: 'lora', label: 'Lora', category: 'serif', stack: "'Lora', Georgia, serif", google: 'Lora:wght@400;500;600' },
  { key: 'merriweather', label: 'Merriweather', category: 'serif', stack: "'Merriweather', Georgia, serif", google: 'Merriweather:wght@400;700' },
  { key: 'source-serif', label: 'Source Serif 4', category: 'serif', stack: "'Source Serif 4', Georgia, serif", google: 'Source Serif 4:wght@400;500;600' },
  { key: 'eb-garamond', label: 'EB Garamond', category: 'serif', stack: "'EB Garamond', Georgia, serif", google: 'EB Garamond:wght@400;500;600' },
  { key: 'cormorant', label: 'Cormorant Garamond', category: 'serif', stack: "'Cormorant Garamond', Georgia, serif", google: 'Cormorant Garamond:wght@400;500;600' },
  { key: 'dm-mono', label: 'DM Mono', category: 'mono', stack: "'DM Mono', monospace" },
  { key: 'ibm-plex-mono', label: 'IBM Plex Mono', category: 'mono', stack: "'IBM Plex Mono', monospace", google: 'IBM Plex Mono:wght@400;500' },
  { key: 'jetbrains-mono', label: 'JetBrains Mono', category: 'mono', stack: "'JetBrains Mono', monospace", google: 'JetBrains Mono:wght@400;500' },
  { key: 'space-mono', label: 'Space Mono', category: 'mono', stack: "'Space Mono', monospace", google: 'Space Mono:wght@400;700' },
  { key: 'system-sans', label: 'System sans', category: 'sans', stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { key: 'system-serif', label: 'System serif', category: 'serif', stack: "ui-serif, Georgia, 'Times New Roman', serif" },
];

export const DEFAULT_HEADING_FONT = 'instrument-serif';
export const DEFAULT_HEADING_SIZE = 25;
export const DEFAULT_BODY_SIZE = 12;

/** The three original choices map onto the new font list so saved content keeps its look. */
const LEGACY_FONT_KEY: Record<Appearance['font'], string> = {
  system: 'dm-sans',
  serif: 'instrument-serif',
  mono: 'dm-mono',
};

const byKey = (key: string | undefined) => FONT_OPTIONS.find((font) => font.key === key);

export function resolveBodyFont(appearance: Appearance): FontOption {
  return byKey(appearance.bodyFont) ?? byKey(LEGACY_FONT_KEY[appearance.font])!;
}

export function resolveHeadingFont(appearance: Appearance): FontOption {
  return byKey(appearance.headingFont) ?? byKey(DEFAULT_HEADING_FONT)!;
}

/** Keeps the legacy `font` field loosely in sync so older consumers still see a valid value. */
export function legacyFontFor(font: FontOption): Appearance['font'] {
  return font.category === 'serif' ? 'serif' : font.category === 'mono' ? 'mono' : 'system';
}

const loadedFonts = new Set<string>();

/** Loads any Google-hosted fonts that are in use and not yet on the page. */
export function ensureFontsLoaded(fonts: FontOption[]): void {
  if (typeof document === 'undefined') return;
  for (const font of fonts) {
    if (!font.google || loadedFonts.has(font.key)) continue;
    loadedFonts.add(font.key);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.google.replaceAll(' ', '+')}&display=swap`;
    link.dataset.siteFont = font.key;
    document.head.appendChild(link);
  }
}

/** CSS custom properties that carry every appearance setting. */
export function appearanceVars(appearance: Appearance): Record<string, string> {
  const body = resolveBodyFont(appearance);
  const heading = resolveHeadingFont(appearance);
  const vars: Record<string, string> = {
    '--paper': appearance.backgroundColor,
    '--ink': appearance.textColor,
    '--link': appearance.linkColor ?? appearance.accentColor,
    '--accent-color': appearance.accentColor,
    '--content-width': `${appearance.contentWidth}px`,
    '--app-font-sans': body.stack,
    '--font-heading': heading.stack,
    '--heading-size': `${appearance.headingSize ?? DEFAULT_HEADING_SIZE}px`,
    '--body-size': `${appearance.bodySize ?? DEFAULT_BODY_SIZE}px`,
    '--section-heading-size': `${appearance.sectionHeadingSize ?? 12}px`,
    '--subheading-size': `${appearance.subheadingSize ?? 16}px`,
    '--nav-size': `${appearance.navSize ?? 12}px`,
    '--caption-size': `${appearance.captionSize ?? 11}px`,
    '--meta-size': `${appearance.metaSize ?? 11}px`,
    '--page-margin': `${appearance.pageMargin ?? 20}px`,
    '--section-spacing': `${appearance.sectionSpacing ?? 53}px`,
    '--element-spacing': `${appearance.elementSpacing ?? 17}px`,
    '--image-max-width': `${appearance.imageMaxWidth ?? appearance.contentWidth}px`,
    '--corner-radius': `${appearance.cornerRadius ?? 2}px`,
    '--text-align': appearance.textAlign ?? 'left',
    '--border-color': appearance.borderColor ?? '#e4e3dd',
    '--link-hover': appearance.linkHoverColor ?? appearance.linkColor ?? appearance.accentColor,
  };
  if (appearance.headingColor) vars['--heading-color'] = appearance.headingColor;
  // Navigation, labels and the footer stay monospaced by default (the site's identity),
  // and follow the body font once one has been chosen explicitly.
  if (appearance.bodyFont) vars['--font-ui'] = body.stack;
  return vars;
}

/** Applies appearance to :root so portals (modals) and the page background match. */
export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  const vars = appearanceVars(appearance);
  for (const name of ['--heading-color', '--font-ui']) {
    if (!(name in vars)) root.style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  ensureFontsLoaded([resolveBodyFont(appearance), resolveHeadingFont(appearance)]);
}

export const appearanceStyle = (appearance: Appearance): CSSProperties =>
  appearanceVars(appearance) as CSSProperties;
