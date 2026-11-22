import { Link, useRoute } from 'wouter';
import { useGetPublicContent } from '@workspace/api-client-react';
import { ContentBlocks } from '@/components/content-blocks';
import { usePageMeta } from '@/hooks/use-page-meta';
import { findUniqueBySlug } from '@/lib/editorial';

export default function CaseStudyDetail() {
  const [, params] = useRoute('/case-study/:slug');
  const query = useGetPublicContent();
  const study = query.data ? findUniqueBySlug(query.data.caseStudies.filter((item) => item.published), params?.slug ?? '') : undefined;
  usePageMeta(study ? `${study.title} — Ashfa Aqeel` : 'Case study not found — Ashfa Aqeel', study?.description || 'Selected work by Ashfa Aqeel.');

  if (query.isLoading) return <div className="loading-state" role="status">Gathering the case study…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert"><p className="empty-title">The case study could not be loaded.</p><Link href="/case-study">Back to Case Studies</Link></div>;
  if (!study) return <div className="not-found"><h1 className="page-title">Case study not found</h1><p className="page-intro">This case study may be unpublished, missing, or have an ambiguous slug.</p><Link href="/case-study">Back to Case Studies</Link></div>;

  return <article className="editorial-detail">
    <Link className="detail-back" href="/case-study">Back to Case Studies</Link>
    <header className="detail-header">
      <p className="detail-meta">{study.year ?? ''}{study.author && ` · ${study.author}`}</p>
      <h1 className="page-title">{study.title}</h1>
      {study.subtitle && <p className="detail-subtitle">{study.subtitle}</p>}
      {study.imageUrl && <img className="detail-cover" src={study.imageUrl} alt="" decoding="async" />}
      {study.description && <div className="detail-description"><ContentBlocks fallback={study.description} /></div>}
      {study.href && <p className="detail-external"><a href={study.href} target={study.href.startsWith('http') ? '_blank' : undefined} rel={study.href.startsWith('http') ? 'noreferrer' : undefined}>Visit project</a></p>}
    </header>
    <div className="detail-body markdown-body"><ContentBlocks blocks={study.blocks} fallback={study.body} /></div>
  </article>;
}
