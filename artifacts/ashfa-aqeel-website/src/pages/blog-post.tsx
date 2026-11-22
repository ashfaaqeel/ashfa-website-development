import { Link, useRoute } from 'wouter';
import { useGetPublicContent } from '@workspace/api-client-react';
import { ContentBlocks } from '@/components/content-blocks';
import { usePageMeta } from '@/hooks/use-page-meta';
import { findUniqueBySlug } from '@/lib/editorial';

export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug');
  const query = useGetPublicContent();
  const post = query.data ? findUniqueBySlug(query.data.posts.filter((item) => item.published), params?.slug ?? '') : undefined;
  usePageMeta(post ? `${post.title} — Ashfa Aqeel` : 'Article not found — Ashfa Aqeel', post?.description || 'Writing by Ashfa Aqeel.');

  if (query.isLoading) return <div className="loading-state" role="status">Gathering the article…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert"><p className="empty-title">The article could not be loaded.</p><Link href="/blog">Back to Blog</Link></div>;
  if (!post) return <div className="not-found"><h1 className="page-title">Article not found</h1><p className="page-intro">This article may be unpublished, missing, or have an ambiguous slug.</p><Link href="/blog">Back to Blog</Link></div>;

  return <article className="editorial-detail">
    <Link className="detail-back" href="/blog">Back to Blog</Link>
    <header className="detail-header">
      <p className="detail-meta">{post.date}{post.author && ` · ${post.author}`}</p>
      <h1 className="page-title">{post.title}</h1>
      {post.subtitle && <p className="detail-subtitle">{post.subtitle}</p>}
      {post.imageUrl && <img className="detail-cover" src={post.imageUrl} alt="" decoding="async" />}
      {post.description && <div className="detail-description"><ContentBlocks fallback={post.description} /></div>}
    </header>
    <div className="detail-body markdown-body"><ContentBlocks blocks={post.blocks} fallback={post.body} /></div>
  </article>;
}
