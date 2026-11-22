import ReactMarkdown, { type Components } from 'react-markdown';

const isExternal = (href?: string) => Boolean(href && /^https?:\/\//i.test(href));

const linkComponents: Components = {
  a({ href, children, title }) {
    const external = isExternal(href);
    return (
      <a href={href} title={title} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    );
  },
};

/**
 * Block Markdown (paragraphs, links, emphasis, lists, quotes, images). Raw HTML is never
 * rendered and unsafe URL schemes such as javascript: are removed by react-markdown.
 */
export function RichText({ children }: { children: string }) {
  return <ReactMarkdown components={linkComponents}>{children}</ReactMarkdown>;
}

/** Inline-only Markdown for short text fields: links, bold, italic and code, no block elements. */
export function InlineRichText({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{ ...linkComponents, p: ({ children: inner }) => <>{inner}</> }}
      allowedElements={['p', 'a', 'em', 'strong', 'code']}
      unwrapDisallowed
    >
      {children}
    </ReactMarkdown>
  );
}
