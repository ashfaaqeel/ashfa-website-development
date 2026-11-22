import { useGetPublicContent } from '@workspace/api-client-react';
import { InlineRichText } from '@/components/rich-text';
import { usePageMeta } from '@/hooks/use-page-meta';
import { groupBooks } from '@/lib/books';

export default function Books() {
  usePageMeta('Books — Ashfa Aqeel', 'Books shared by Ashfa Aqeel.');
  const query = useGetPublicContent();
  if (query.isLoading) return <div className="loading-state" role="status" data-testid="status-books-loading">Opening the shelf…</div>;
  if (query.isError || !query.data) return <div className="empty-state" role="alert" data-testid="status-books-error"><p className="empty-title">The shelf could not be loaded.</p><button className="retry-button" onClick={() => query.refetch()} data-testid="button-retry-books">Try again</button></div>;
  const books = query.data.books.filter((book) => book.published);
  const groups = groupBooks(books, query.data.bookCategories);
  return <>
    <h1 className="page-title" data-testid="text-page-title">Books</h1>
    <p className="page-intro">A small shelf of books I choose to share.</p>
    {books.length === 0 ? <div className="empty-state" role="status" data-testid="status-books-empty"><p className="empty-title">The shelf is empty for now.</p></div> : groups.map((group) => (
      <section className="book-group" key={group.category} aria-labelledby={`books-${group.category.replace(/\W+/g, '-')}`} data-testid={`group-books-${group.category}`}>
        <h2 className="section-label" id={`books-${group.category.replace(/\W+/g, '-')}`}>{group.category}</h2>
        <ol className="book-list">{group.books.map((book) => (
          <li className={`book-row${book.imageUrl ? ' has-cover' : ''}`} key={book.id} data-testid={`row-book-${book.id}`}>
            {book.imageUrl && <img className="book-cover" src={book.imageUrl} alt={`Cover of ${book.title}`} loading="lazy" decoding="async" data-testid={`img-book-${book.id}`} />}
            <div>
              <p className="book-line">
                {book.href ? <a className="book-title" href={book.href} data-testid={`link-book-${book.id}`}>{book.title}</a> : <span className="book-title">{book.title}</span>}
                {book.author && <span className="book-author"> — {book.author}</span>}
              </p>
              {book.note && <p className="book-note"><InlineRichText>{book.note}</InlineRichText></p>}
            </div>
          </li>
        ))}</ol>
      </section>
    ))}
  </>;
}
