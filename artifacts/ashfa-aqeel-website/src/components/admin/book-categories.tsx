import { useState } from 'react';
import type { SiteContent } from '@workspace/api-client-react';
import { FALLBACK_CATEGORY, isFallbackCategory, resolveCategories } from '@/lib/books';

type Props = { content: SiteContent; change: (next: SiteContent) => void };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Add, rename, reorder and remove book categories. Books follow their category on rename. */
export function BookCategoryManager({ content, change }: Props) {
  const categories = resolveCategories(content.bookCategories);
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState('');

  const countIn = (name: string) => content.books.filter((book) => same(book.category?.trim() || FALLBACK_CATEGORY, name)).length;
  const commit = (list: string[], books = content.books) => { setProblem(''); change({ ...content, bookCategories: list, books }); };
  const taken = (name: string, ignoreIndex = -1) => categories.some((item, i) => i !== ignoreIndex && same(item, name));

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (taken(name)) { setProblem(`“${name}” already exists.`); return; }
    commit([...categories, name]);
    setDraft('');
  };

  const rename = (index: number, value: string) => {
    const name = value.trim();
    const old = categories[index];
    if (!name || name === old) return;
    if (taken(name, index)) { setProblem(`“${name}” already exists.`); return; }
    commit(
      categories.map((item, i) => (i === index ? name : item)),
      content.books.map((book) => (book.category && same(book.category, old) ? { ...book, category: name } : book)),
    );
  };

  const remove = (index: number) => {
    const old = categories[index];
    const moved = countIn(old);
    if (!window.confirm(moved ? `Remove “${old}”? Its ${moved} book(s) will move to “${FALLBACK_CATEGORY}”.` : `Remove “${old}”?`)) return;
    commit(
      categories.filter((_, i) => i !== index),
      content.books.map((book) => (book.category && same(book.category, old) ? { ...book, category: FALLBACK_CATEGORY } : book)),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target]!, next[index]!];
    commit(next);
  };

  return (
    <section className="admin-group" data-testid="panel-book-categories">
      <div className="admin-group-head"><h3 className="admin-section-title">Categories</h3></div>
      <p className="admin-hint">The order here is the order on the Books page. “{FALLBACK_CATEGORY}” is the fallback for uncategorised books and stays.</p>
      {categories.map((name, index) => {
        const fallback = isFallbackCategory(name);
        return (
          <div className="admin-cat-row" key={`${index}-${name}`}>
            <input aria-label={`Category ${index + 1}`} defaultValue={name} disabled={fallback} onBlur={(event) => rename(index, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} data-testid={`input-category-${index}`} />
            <span className="admin-cat-count">{countIn(name)} book{countIn(name) === 1 ? '' : 's'}</span>
            <button type="button" className="admin-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${name} up`} data-testid={`button-category-up-${index}`}>↑</button>
            <button type="button" className="admin-button" onClick={() => move(index, 1)} disabled={index === categories.length - 1} aria-label={`Move ${name} down`} data-testid={`button-category-down-${index}`}>↓</button>
            <button type="button" className="admin-button danger" onClick={() => remove(index)} disabled={fallback} data-testid={`button-category-remove-${index}`}>Remove</button>
          </div>
        );
      })}
      <div className="admin-cat-row">
        <input aria-label="New category name" placeholder="New category" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} maxLength={60} data-testid="input-category-new" />
        <button type="button" className="admin-button" onClick={add} data-testid="button-category-add">Add category</button>
      </div>
      {problem && <p className="admin-error" role="alert" data-testid="status-category-error">{problem}</p>}
    </section>
  );
}
