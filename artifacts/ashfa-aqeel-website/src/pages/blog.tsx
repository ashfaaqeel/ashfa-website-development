import ReactMarkdown from 'react-markdown';
import { useGetPublicContent } from '@workspace/api-client-react';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function Blog() {
  usePageMeta('Blog — Ashfa Aqeel', 'Writing by Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-blog-loading">Gathering the writing…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-blog-error"><p className="empty-title">The writing could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-blog">Try again</button></div>;
  const posts = query.data.posts.filter((post) => post.published);
  return <><h1 className="page-title" data-testid="text-page-title">Blog</h1><p className="page-intro">Notes and writing.</p>{posts.length === 0 ? <div className="empty-state" role="status" data-testid="status-blog-empty"><p className="empty-title">Nothing here just yet.</p></div> : <ol className="entry-list">{posts.map((post) => <li className="entry-row" key={post.id} data-testid={`row-post-${post.id}`}><time>{post.date}</time><div><span className="entry-title" data-testid={`text-post-title-${post.id}`}>{post.title}</span>{post.description && <p>{post.description}</p>}{post.body && <div className="markdown-body" data-testid={`text-post-body-${post.id}`}><ReactMarkdown>{post.body}</ReactMarkdown></div>}</div></li>)}</ol>}</>;
}
