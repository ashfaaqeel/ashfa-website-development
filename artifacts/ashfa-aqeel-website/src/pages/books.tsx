import { useGetPublicContent } from '@workspace/api-client-react';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function Books() {
  usePageMeta('Books — Ashfa Aqeel', 'Books shared by Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-books-loading">Opening the shelf…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-books-error"><p className="empty-title">The shelf could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-books">Try again</button></div>;
  const books = query.data.books.filter((book) => book.published);
  return <><h1 className="page-title" data-testid="text-page-title">Books</h1><p className="page-intro">A small shelf of books I choose to share.</p>{books.length === 0 ? <div className="empty-state" role="status" data-testid="status-books-empty"><p className="empty-title">The shelf is empty for now.</p></div> : <ol className="book-list">{books.map((book) => <li className="book-row" key={book.id} data-testid={`row-book-${book.id}`}><div>{book.href ? <a className="book-title" href={book.href} data-testid={`link-book-${book.id}`}>{book.title}</a> : <p className="book-title">{book.title}</p>}<p className="book-author">{book.author}</p>{book.note && <p className="book-note">{book.note}</p>}</div></li>)}</ol>}</>;
}
