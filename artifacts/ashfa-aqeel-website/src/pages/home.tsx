import { useGetPublicContent } from '@workspace/api-client-react';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function Home() {
  usePageMeta('Ashfa Aqeel', 'A personal website for Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-home-loading">Loading Ashfa’s site…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-home-error"><p className="empty-title">This page could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-home">Try again</button></div>;
  const { profile } = query.data;
  const paragraphs = profile.introduction.split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);
  return <>
    <h1 className="page-title" data-testid="text-page-title">{profile.name}</h1>
    <section className="section" aria-labelledby="background-heading">
      <h2 className="section-label" id="background-heading">My background story</h2>
      {paragraphs.length === 0 ? <p className="empty-inline" role="status" data-testid="status-story-empty">Nothing here just yet.</p> : paragraphs.map((paragraph, index) => <p className="prose-copy" key={`${index}-${paragraph.slice(0, 14)}`} data-testid={`text-story-${index + 1}`}>{paragraph}</p>)}
    </section>
    <section className="section" aria-labelledby="journey-heading"><h2 className="section-label" id="journey-heading">My Journey</h2>{profile.journey.length === 0 ? <p className="empty-inline" role="status" data-testid="status-journey-empty">Nothing here just yet.</p> : <ol className="journey">{profile.journey.map((item, index) => <li key={`${item.age}-${index}`} data-testid={`row-journey-${index + 1}`}><span className="journey-age">{item.age}</span><span>{item.milestone}</span></li>)}</ol>}</section>
    <section className="section" aria-labelledby="interests-heading"><h2 className="section-label" id="interests-heading">What I'm Into</h2>{profile.interests.length === 0 ? <p className="empty-inline" role="status" data-testid="status-interests-empty">Nothing here just yet.</p> : <ul className="interest-list">{profile.interests.map((interest, index) => <li key={`${interest}-${index}`} data-testid={`text-interest-${index + 1}`}>{interest}</li>)}</ul>}</section>
    <section className="section" aria-labelledby="find-me-heading"><h2 className="section-label" id="find-me-heading">Where to Find Me</h2>{profile.placesToFindMe.length === 0 ? <p className="empty-inline" role="status" data-testid="status-links-empty">Nothing here just yet.</p> : <ul className="social-list">{profile.placesToFindMe.map((place, index) => <li key={`${place.platform}-${index}`} data-testid={`row-social-${index + 1}`}><span className="social-name">{place.platform}</span><span>{place.href ? <a href={place.href} data-testid={`link-social-${index + 1}`} target={place.href.startsWith('http') ? '_blank' : undefined} rel={place.href.startsWith('http') ? 'noreferrer' : undefined}>{place.label}</a> : place.label}</span></li>)}</ul>}</section>
  </>;
}
