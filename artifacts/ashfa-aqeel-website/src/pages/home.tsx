import { useGetPublicContent, type PageSection, type ProfileContent } from '@workspace/api-client-react';
import { useContactDialog } from '@/components/contact-dialog';
import { InlineRichText, RichText } from '@/components/rich-text';
import { usePageMeta } from '@/hooks/use-page-meta';

/**
 * Entries that should open the contact form: placeholder or legacy contact links
 * (#, #contact, /contact), or an entry named like a contact CTA that has no address.
 * Real links, including mailto:, are left exactly as they are.
 */
const isContactLink = (place: { platform: string; label: string; href: string }) => {
  const href = place.href.trim();
  if (/^(#|#contact|\/contact\/?|contact)$/i.test(href)) return true;
  return href === '' && /contact|get in touch|say hello|message me/i.test(`${place.platform} ${place.label}`);
};

function FlexibleSection({ section }: { section: PageSection }) {
  const entries = section.entries?.filter((entry) => !entry.hidden) ?? [];
  return (
    <section className={`section flexible-section section-${section.layout}${entries.length > 0 ? ' has-entries' : ''}`} aria-labelledby={`${section.id}-heading`}>
      {(section.heading || section.subtitle) && <div className="flexible-section-heading">
        {section.heading && <h2 className="section-label" id={`${section.id}-heading`}><InlineRichText>{section.heading}</InlineRichText></h2>}
        {section.subtitle && <p className="section-subtitle"><InlineRichText>{section.subtitle}</InlineRichText></p>}
      </div>}
      <div className="flexible-section-copy">
        {section.description && <div className="prose-copy"><RichText>{section.description}</RichText></div>}
        {section.body && <div className="prose-copy"><RichText>{section.body}</RichText></div>}
      </div>
      {entries.length > 0 && <div className="flexible-section-entries"><ul className="flexible-entry-list">{entries.map((entry) => <li key={entry.id} className="flexible-entry">
        {entry.imageUrl && <img className="entry-image" src={entry.imageUrl} alt="" loading="lazy" decoding="async" />}
        <div>{entry.label && (entry.href ? <a href={entry.href}><InlineRichText>{entry.label}</InlineRichText></a> : <strong><InlineRichText>{entry.label}</InlineRichText></strong>)}{entry.text && <span className="flexible-entry-text"><InlineRichText>{entry.text}</InlineRichText></span>}</div>
      </li>)}</ul></div>}
    </section>
  );
}

const EMPTY_PROFILE: ProfileContent = {
  name: 'Ashfa Aqeel',
  introduction: '',
  journey: [],
  interests: [],
  placesToFindMe: [],
};

function normalizeProfile(value: unknown): ProfileContent {
  if (!value || typeof value !== 'object') return EMPTY_PROFILE;

  const candidate = value as Record<string, unknown>;
  const journey = Array.isArray(candidate.journey)
    ? candidate.journey.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object').map((item) => ({
      age: typeof item.age === 'string' ? item.age : '',
      milestone: typeof item.milestone === 'string' ? item.milestone : '',
    }))
    : [];
  const placesToFindMe = Array.isArray(candidate.placesToFindMe)
    ? candidate.placesToFindMe.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object').map((item) => ({
      platform: typeof item.platform === 'string' ? item.platform : '',
      label: typeof item.label === 'string' ? item.label : '',
      href: typeof item.href === 'string' ? item.href : '',
    }))
    : [];

  return {
    name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : EMPTY_PROFILE.name,
    introduction: typeof candidate.introduction === 'string' ? candidate.introduction : EMPTY_PROFILE.introduction,
    journey,
    interests: Array.isArray(candidate.interests) ? candidate.interests.filter((item): item is string => typeof item === 'string') : [],
    placesToFindMe,
  };
}

export default function Home() {
  const { openContact } = useContactDialog();
  usePageMeta('Ashfa Aqeel', 'A personal website for Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-home-loading">Loading Ashfa’s site…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-home-error"><p className="empty-title">This page could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-home">Try again</button></div>;
  const profile = normalizeProfile(query.data.profile);
  const paragraphs = profile.introduction.split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);
  return <>
    <h1 className="page-title" data-testid="text-page-title">{profile.name}</h1>
    <section className="section" aria-labelledby="background-heading">
      <h2 className="section-label" id="background-heading">My background story</h2>
      {paragraphs.length === 0 ? <p className="empty-inline" role="status" data-testid="status-story-empty">Nothing here just yet.</p> : paragraphs.map((paragraph, index) => <div className="prose-copy" key={`${index}-${paragraph.slice(0, 14)}`} data-testid={`text-story-${index + 1}`}><RichText>{paragraph}</RichText></div>)}
    </section>
    <section className="section" aria-labelledby="journey-heading"><h2 className="section-label" id="journey-heading">My Journey</h2>{profile.journey.length === 0 ? <p className="empty-inline" role="status" data-testid="status-journey-empty">Nothing here just yet.</p> : <ol className="journey">{profile.journey.map((item, index) => <li key={`${item.age}-${index}`} data-testid={`row-journey-${index + 1}`}><span className="journey-age">{item.age}</span><span><InlineRichText>{item.milestone}</InlineRichText></span></li>)}</ol>}</section>
    <section className="section" aria-labelledby="interests-heading"><h2 className="section-label" id="interests-heading">What I'm Into</h2>{profile.interests.length === 0 ? <p className="empty-inline" role="status" data-testid="status-interests-empty">Nothing here just yet.</p> : <ul className="interest-list">{profile.interests.map((interest, index) => <li key={`${interest}-${index}`} data-testid={`text-interest-${index + 1}`}><InlineRichText>{interest}</InlineRichText></li>)}</ul>}</section>
    <section className="section" aria-labelledby="find-me-heading"><h2 className="section-label" id="find-me-heading">Where to Find Me</h2>{profile.placesToFindMe.length === 0 ? <p className="empty-inline" role="status" data-testid="status-links-empty">Nothing here just yet.</p> : <ul className="social-list">{profile.placesToFindMe.map((place, index) => <li key={`${place.platform}-${index}`} data-testid={`row-social-${index + 1}`}><span className="social-name">{place.href ? <a href={place.href} target={place.href.startsWith('http') ? '_blank' : undefined} rel={place.href.startsWith('http') ? 'noreferrer' : undefined}><InlineRichText>{place.platform}</InlineRichText></a> : <InlineRichText>{place.platform}</InlineRichText>}</span><span>{isContactLink(place) ? <button type="button" className="inline-link-button" onClick={openContact} data-testid={`button-social-contact-${index + 1}`}><InlineRichText>{place.label}</InlineRichText></button> : <InlineRichText>{place.label}</InlineRichText>}</span></li>)}</ul>}</section>
    {query.data.sections?.filter((section) => !section.hidden).map((section) => <FlexibleSection key={section.id} section={section} />)}
  </>;
}
