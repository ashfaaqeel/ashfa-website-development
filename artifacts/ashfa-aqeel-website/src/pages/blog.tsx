import { useGetPublicContent } from '@workspace/api-client-react';
import { InlineRichText } from '@/components/rich-text';
import { Link } from 'wouter';
import { excerpt, resolvedSlug } from '@/lib/editorial';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function Blog() {
  usePageMeta('Blog — Ashfa Aqeel', 'Writing by Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-blog-loading">Gathering the writing…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-blog-error"><p className="empty-title">The writing could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-blog">Try again</button></div>;
  const posts = query.data.posts.filter((post) => post.published);
  const copy = query.data.pageCopy;
  return <><h1 className="page-title" data-testid="text-page-title">{copy?.blogTitle || 'Blog'}</h1><p className="page-intro">{copy?.blogIntro || 'Notes and writing.'}</p>{posts.length === 0 ? <div className="empty-state" role="status" data-testid="status-blog-empty"><p className="empty-title">Nothing here just yet.</p></div> : <ol className="entry-list">{posts.map((post) => { const slug = resolvedSlug(post); const duplicate = posts.some((other) => other.id !== post.id && resolvedSlug(other).toLowerCase() === slug.toLowerCase()); return <li className="entry-row" key={post.id} data-testid={`row-post-${post.id}`}><time>{post.cardShowDate === false ? '' : post.date}</time><div>{post.cardShowTitle === false ? null : duplicate ? <span className="entry-title" data-testid={`text-post-title-${post.id}`}>{post.title}</span> : <Link className="entry-title" href={`/blog/${encodeURIComponent(slug)}`} data-testid={`link-post-${post.id}`}>{post.title}</Link>}{post.cardShowImage !== false && post.imageUrl && <img className="entry-image" src={post.imageUrl} alt="" loading="lazy" decoding="async" data-testid={`img-post-${post.id}`} />}{post.cardShowDescription !== false && post.description && <p><InlineRichText>{excerpt(post.description)}</InlineRichText></p>}{post.author && <p className="entry-meta">{post.author}</p>}{!duplicate && <Link className="entry-action" href={`/blog/${encodeURIComponent(slug)}`}>Read article</Link>}</div></li>; })}</ol>}</>;
}
