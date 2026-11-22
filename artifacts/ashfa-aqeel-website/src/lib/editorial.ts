import type { BlogPost, CaseStudy } from '@workspace/api-client-react';

export type EditorialEntry = BlogPost | CaseStudy;

export function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

export function resolvedSlug(entry: EditorialEntry): string {
  return entry.slug.trim() || slugifyTitle(entry.title);
}

export function findUniqueBySlug<T extends EditorialEntry>(entries: T[], routeSlug: string): T | undefined {
  let normalized: string;
  try {
    normalized = decodeURIComponent(routeSlug).trim().toLowerCase();
  } catch {
    return undefined;
  }
  const matches = entries.filter((entry) => resolvedSlug(entry).toLowerCase() === normalized);
  return matches.length === 1 ? matches[0] : undefined;
}

export function excerpt(value: string, maxLength = 180): string {
  const plain = value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength - 1).trimEnd()}…` : plain;
}
