import type { Book } from '@workspace/api-client-react';

export const FALLBACK_CATEGORY = 'Other';
export const DEFAULT_BOOK_CATEGORIES = ['Classics', 'Economics', 'Business', 'Islam & History', FALLBACK_CATEGORY];

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const isFallbackCategory = (name: string) => same(name, FALLBACK_CATEGORY);

/** Categories to use: the saved list, or the defaults for content saved before categories existed. */
export function resolveCategories(saved: string[] | undefined): string[] {
  const list = saved && saved.length > 0 ? saved : DEFAULT_BOOK_CATEGORIES;
  return list.some(isFallbackCategory) ? list : [...list, FALLBACK_CATEGORY];
}

/** Books grouped in category order. Books with no (or an unknown) category fall into "Other". */
export function groupBooks(books: Book[], savedCategories: string[] | undefined) {
  const categories = resolveCategories(savedCategories);
  return categories
    .map((category) => ({
      category,
      books: books.filter((book) => {
        const own = book.category?.trim();
        const known = own ? categories.find((name) => same(name, own)) : undefined;
        return known ? same(known, category) : isFallbackCategory(category);
      }),
    }))
    .filter((group) => group.books.length > 0);
}
