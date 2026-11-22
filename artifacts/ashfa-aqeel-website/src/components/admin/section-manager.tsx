import type { PageSection, SectionEntry, SiteContent } from '@workspace/api-client-react';
import { MarkdownTextarea } from '@/components/markdown-textarea';

type Props = { content: SiteContent; change: (next: SiteContent) => void; makeId: () => string };

const emptySection = (id: string): PageSection => ({ id, heading: '', subtitle: '', description: '', body: '', layout: 'prose', hidden: false, entries: [] });
const emptyEntry = (id: string): SectionEntry => ({ id, label: '', text: '', href: '', hidden: false });

export function SectionManager({ content, change, makeId }: Props) {
  const sections = content.sections ?? [];
  const update = (id: string, patch: Partial<PageSection>) => change({ ...content, sections: sections.map((section) => section.id === id ? { ...section, ...patch } : section) });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target]!, next[index]!];
    change({ ...content, sections: next });
  };
  const updateEntry = (section: PageSection, id: string, patch: Partial<SectionEntry>) => update(section.id, { entries: (section.entries ?? []).map((entry) => entry.id === id ? { ...entry, ...patch } : entry) });
  const moveEntry = (section: PageSection, index: number, direction: -1 | 1) => { const entries = [...(section.entries ?? [])]; const target = index + direction; if (target < 0 || target >= entries.length) return; [entries[index], entries[target]] = [entries[target]!, entries[index]!]; update(section.id, { entries }); };
  return <section className="admin-group" data-testid="panel-homepage-sections">
    <div className="admin-group-head"><h3 className="admin-section-title">Flexible homepage sections</h3><button className="admin-button" type="button" onClick={() => change({ ...content, sections: [...sections, emptySection(makeId())] })} data-testid="button-add-home-section">Add section</button></div>
    <p className="admin-hint">When at least one section exists, these sections replace the legacy homepage headings. Empty headings are allowed.</p>
    {sections.map((section, index) => <article className="admin-card" key={section.id}>
      <div className="admin-card-head"><h3 className="admin-card-title">{section.heading || 'Untitled section'}</h3><span className={`admin-badge ${section.hidden ? '' : 'live'}`}>{section.hidden ? 'Hidden' : 'Visible'}</span></div>
      <div className="admin-grid"><Field label="Heading" value={section.heading ?? ''} onChange={(heading) => update(section.id, { heading })} /><Field label="Subtitle" value={section.subtitle ?? ''} onChange={(subtitle) => update(section.id, { subtitle })} /><div className="admin-field"><label htmlFor={`section-layout-${section.id}`}>Layout</label><select id={`section-layout-${section.id}`} value={section.layout} onChange={(event) => update(section.id, { layout: event.target.value as PageSection['layout'] })}><option value="prose">Prose</option><option value="split">Split</option><option value="compact">Compact</option><option value="links">Links</option></select></div></div>
      <MarkdownTextarea label="Description" value={section.description ?? ''} onChange={(description) => update(section.id, { description })} testId={`textarea-section-description-${section.id}`} rows={4} />
      <MarkdownTextarea label="Body" value={section.body ?? ''} onChange={(body) => update(section.id, { body })} testId={`textarea-section-body-${section.id}`} rows={5} />
      <div className="admin-group"><div className="admin-group-head"><h4 className="admin-section-title">Entries</h4><button type="button" className="admin-button" onClick={() => update(section.id, { entries: [...(section.entries ?? []), emptyEntry(makeId())] })}>Add entry</button></div>{(section.entries ?? []).map((entry, entryIndex) => <div className="admin-card" key={entry.id}><div className="admin-grid"><MarkdownTextarea label="Label" value={entry.label ?? ''} onChange={(label) => updateEntry(section, entry.id, { label })} testId={`textarea-entry-label-${entry.id}`} rows={2} /><MarkdownTextarea label="Description" value={entry.text} onChange={(text) => updateEntry(section, entry.id, { text })} testId={`textarea-entry-text-${entry.id}`} rows={2} /><Field label="Link" value={entry.href ?? ''} onChange={(href) => updateEntry(section, entry.id, { href })} /><div className="admin-field"><label htmlFor={`entry-image-${entry.id}`}>Image URL</label><input id={`entry-image-${entry.id}`} value={entry.imageUrl ?? ''} onChange={(event) => updateEntry(section, entry.id, { imageUrl: event.target.value })} /></div></div><div className="admin-actions"><button type="button" className="admin-button" onClick={() => moveEntry(section, entryIndex, -1)} disabled={entryIndex === 0}>Move up</button><button type="button" className="admin-button" onClick={() => moveEntry(section, entryIndex, 1)} disabled={entryIndex === (section.entries?.length ?? 1) - 1}>Move down</button><button type="button" className="admin-button" onClick={() => updateEntry(section, entry.id, { hidden: !entry.hidden })}>{entry.hidden ? 'Restore' : 'Hide'}</button><button type="button" className="admin-button danger" onClick={() => update(section.id, { entries: (section.entries ?? []).filter((item) => item.id !== entry.id) })}>Remove</button></div></div>)}</div>
      <div className="admin-actions"><button className="admin-button" type="button" onClick={() => move(index, -1)} disabled={index === 0}>Move up</button><button className="admin-button" type="button" onClick={() => move(index, 1)} disabled={index === sections.length - 1}>Move down</button><button className="admin-button" type="button" onClick={() => update(section.id, { hidden: !section.hidden })}>{section.hidden ? 'Restore' : 'Hide'}</button><button className="admin-button danger" type="button" onClick={() => { if (window.confirm('Remove this homepage section?')) change({ ...content, sections: sections.filter((item) => item.id !== section.id) }); }}>Delete</button></div>
    </article>)}
  </section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `section-${label.toLowerCase().replaceAll(' ', '-')}`;
  return <div className="admin-field"><label htmlFor={id}>{label}</label><input id={id} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}