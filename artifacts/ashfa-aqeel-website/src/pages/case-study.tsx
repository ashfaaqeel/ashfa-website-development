import { useGetPublicContent } from '@workspace/api-client-react';
import { InlineRichText } from '@/components/rich-text';
import { Link } from 'wouter';
import { excerpt, resolvedSlug } from '@/lib/editorial';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function CaseStudy() {
  usePageMeta('Case Study — Ashfa Aqeel', 'Selected case studies by Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-studies-loading">Loading selected work…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-studies-error"><p className="empty-title">Selected work could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-studies">Try again</button></div>;
  const studies = query.data.caseStudies.filter((study) => study.published);
  const copy = query.data.pageCopy;
  return <><h1 className="page-title" data-testid="text-page-title">{copy?.studiesTitle || 'Case Study'}</h1><p className="page-intro">{copy?.studiesIntro || 'A closer look at selected work.'}</p>{studies.length === 0 ? <div className="empty-state" role="status" data-testid="status-case-studies-empty"><p className="empty-title">No case studies yet.</p></div> : <ol className="entry-list">{studies.map((study) => { const slug = resolvedSlug(study); const duplicate = studies.some((other) => other.id !== study.id && resolvedSlug(other).toLowerCase() === slug.toLowerCase()); return <li className="entry-row" key={study.id} data-testid={`row-case-study-${study.id}`}>{study.cardShowDate !== false && study.year && <time>{study.year}</time>}<div>{study.cardShowTitle === false ? null : duplicate ? <span className="entry-title">{study.title}</span> : <Link className="entry-title" href={`/case-study/${encodeURIComponent(slug)}`} data-testid={`link-case-study-${study.id}`}>{study.title}</Link>}{study.cardShowImage !== false && study.imageUrl && <img className="entry-image" src={study.imageUrl} alt="" loading="lazy" decoding="async" data-testid={`img-case-study-${study.id}`} />}{study.cardShowDescription !== false && study.description && <p><InlineRichText>{excerpt(study.description)}</InlineRichText></p>}{study.subtitle && <p className="entry-meta">{study.subtitle}</p>}{study.href && <p className="entry-meta"><a href={study.href} target={study.href.startsWith('http') ? '_blank' : undefined} rel={study.href.startsWith('http') ? 'noreferrer' : undefined}>External project</a></p>}{!duplicate && <Link className="entry-action" href={`/case-study/${encodeURIComponent(slug)}`}>View case study</Link>}</div></li>; })}</ol>}</>;
}
