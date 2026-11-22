import { useEffect, type ReactNode } from 'react';
import { useGetPublicContent } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { ContactProvider, useContactDialog } from '@/components/contact-dialog';
import { LiveClock } from '@/components/live-clock';
import { appearanceStyle, applyAppearance } from '@/lib/appearance';

const defaultNavigation = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Case Study', href: '/case-study' },
  { label: 'Books', href: '/books' },
];

type SiteLayoutProps = {
  children: ReactNode;
};

function SiteFooter() {
  const { openContact } = useContactDialog();
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <span>{'Ashfa Aqeel'}</span>
        <button type="button" className="footer-contact" onClick={openContact} data-testid="button-open-contact">
          Contact
        </button>
      </div>
      <div className="footer-row footer-meta">
        <span data-testid="text-footer-location">India</span>
        <LiveClock />
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const [location] = useLocation();
  const content = useGetPublicContent();
  const appearance = content.data?.appearance;
  const navigation = content.data?.navigation?.filter((item) => !item.hidden) ?? defaultNavigation.map((item, index) => ({ ...item, id: `default-${index}`, hidden: false }));
  useEffect(() => {
    if (appearance) applyAppearance(appearance);
  }, [appearance]);
  const style = appearance ? appearanceStyle(appearance) : undefined;

  return (
    <ContactProvider settings={content.data?.contactSettings}>
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
        <SiteFooter />
      </div>
    </ContactProvider>
  );
}
