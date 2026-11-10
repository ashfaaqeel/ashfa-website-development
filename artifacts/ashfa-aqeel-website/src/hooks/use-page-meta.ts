import { useEffect } from 'react';

function updateMeta(
  selector: string,
  attributes: Record<string, string>,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    document.head.appendChild(element);
  }
  element.content = content;
}

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    updateMeta('meta[name="description"]', { name: 'description' }, description);
    updateMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    updateMeta(
      'meta[property="og:description"]',
      { property: 'og:description' },
      description,
    );
    updateMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
    updateMeta(
      'meta[name="twitter:description"]',
      { name: 'twitter:description' },
      description,
    );
  }, [title, description]);
}
