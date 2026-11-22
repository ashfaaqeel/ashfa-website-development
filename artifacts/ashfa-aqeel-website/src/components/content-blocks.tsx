import type { ContentBlock } from '@workspace/api-client-react';
import { RichText } from '@/components/rich-text';

export function ContentBlocks({ blocks, fallback }: { blocks?: ContentBlock[]; fallback?: string }) {
  if (!blocks?.length) return fallback ? <RichText>{fallback}</RichText> : null;

  return (
    <div className="content-blocks">
      {blocks.map((block) => {
        if (block.type === 'divider') return <hr key={block.id} />;
        if (block.type === 'image' && block.imageUrl) {
          return (
            <figure className="content-block-image" key={block.id}>
              <img src={block.imageUrl} alt={block.alt ?? ''} loading="lazy" decoding="async" />
              {block.caption && <figcaption>{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === 'heading') {
          const Heading = block.level === 3 || block.level === 4 ? (`h${block.level}` as const) : 'h2';
          return <Heading key={block.id}><RichText>{block.text ?? ''}</RichText></Heading>;
        }
        if (block.type === 'quote') return <blockquote key={block.id}><RichText>{block.text ?? ''}</RichText></blockquote>;
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return <List key={block.id}>{(block.items ?? []).map((item, index) => <li key={`${block.id}-${index}`}><RichText>{item}</RichText></li>)}</List>;
        }
        return <div key={block.id}><RichText>{block.text ?? ''}</RichText></div>;
      })}
    </div>
  );
}