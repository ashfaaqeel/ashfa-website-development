import ReactMarkdown from 'react-markdown';
import { useGetPublicContent } from '@workspace/api-client-react';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function CaseStudy() {
  usePageMeta('Case Study — Ashfa Aqeel', 'Selected case studies by Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-studies-loading">Loading selected work…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-studies-error"><p className="empty-title">Selected work could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-studies">Try again</button></div>;
  const studies = query.data.caseStudies.filter((study) => study.published);
  return <><h1 className="page-title" data-testid="text-page-title">Case Study</h1><p className="page-intro">A closer look at selected work.</p>{studies.length === 0 ? <div className="empty-state" role="status" data-testid="status-case-studies-empty"><p className="empty-title">No case studies yet.</p></div> : <ol className="entry-list">{studies.map((study) => <li className="entry-row" key={study.id} data-testid={`row-case-study-${study.id}`}>{study.year && <time>{study.year}</time>}<div>{study.href ? <a href={study.href} data-testid={`link-case-study-${study.id}`}>{study.title}</a> : <span className="entry-title">{study.title}</span>}{study.description && <p>{study.description}</p>}{study.body && <div className="markdown-body" data-testid={`text-case-study-body-${study.id}`}><ReactMarkdown>{study.body}</ReactMarkdown></div>}</div></li>)}</ol>}</>;
}
