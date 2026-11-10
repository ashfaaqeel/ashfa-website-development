import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useGetPublicContent } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Case Study', href: '/case-study' },
  { label: 'Books', href: '/books' },
];

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  const [location] = useLocation();
  const content = useGetPublicContent();
  const appearance = content.data?.appearance;
  useEffect(() => {
    if (!appearance) return;
    const root = document.documentElement;
    root.style.setProperty('--paper', appearance.backgroundColor);
    root.style.setProperty('--ink', appearance.textColor);
    root.style.setProperty('--link', appearance.accentColor);
    root.style.setProperty('--link-hover', appearance.accentColor);
    root.style.setProperty('--content-width', `${appearance.contentWidth}px`);
    root.style.setProperty('--app-font-sans', appearance.font === 'serif' ? "'Instrument Serif', Georgia, serif" : appearance.font === 'mono' ? "'DM Mono', monospace" : "'DM Sans', sans-serif");
  }, [appearance]);
  const style = appearance ? {
    '--paper': appearance.backgroundColor,
    '--ink': appearance.textColor,
    '--link': appearance.accentColor,
    '--link-hover': appearance.accentColor,
    '--app-font-sans': appearance.font === 'serif' ? "'Instrument Serif', Georgia, serif" : appearance.font === 'mono' ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
    '--content-width': `${appearance.contentWidth}px`,
  } as CSSProperties : undefined;

  return (
    <div className="site-shell" style={style}>
      <header>
        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={location === item.href ? 'page' : undefined}
              data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main-content" className="page-content">
        {children}
      </main>
      <footer className="site-footer">
        <span>{'Ashfa Aqeel'}</span>
      </footer>
    </div>
  );
}
