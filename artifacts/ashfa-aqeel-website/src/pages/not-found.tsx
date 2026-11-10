import { Link } from 'wouter';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function NotFound() {
  usePageMeta('Not Found — Ashfa Aqeel', 'This page could not be found.');

  return (
    <div className="not-found">
      <h1 className="page-title" data-testid="text-page-title">That page isn’t here.</h1>
      <p className="page-intro">The address may be incorrect, or the page may have moved.</p>
      <Link href="/" data-testid="link-return-home">Back to Home</Link>
    </div>
  );
}
