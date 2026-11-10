import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminContentQueryKey,
  getGetAdminSessionQueryKey,
  getGetPublicContentQueryKey,
  useGetAdminContent,
  useGetAdminSession,
  useLoginAdmin,
  useLogoutAdmin,
  useUpdateAdminContent,
  type SiteContent,
} from '@workspace/api-client-react';
import { usePageMeta } from '@/hooks/use-page-meta';

type Section = 'story' | 'posts' | 'studies' | 'books' | 'appearance';
const sections: { id: Section; label: string }[] = [
  { id: 'story', label: 'Homepage' },
  { id: 'posts', label: 'Writing' },
  { id: 'studies', label: 'Case studies' },
  { id: 'books', label: 'Books' },
  { id: 'appearance', label: 'Appearance' },
];
const makeId = () => `entry-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
function apiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('data' in error)) return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== 'object' || !('error' in data)) return null;
  return typeof data.error === 'string' ? data.error : null;
}

const freshContent = (): SiteContent => ({
  profile: { name: '', introduction: '', journey: [], interests: [], placesToFindMe: [] },
  appearance: { backgroundColor: '#f7f6f2', textColor: '#282b2a', accentColor: '#587b79', font: 'system', contentWidth: 620 },
  posts: [], caseStudies: [], books: [],
});

function Admin() {
  usePageMeta('Private editor — Ashfa Aqeel', 'Private website editor.');
  const queryClient = useQueryClient();
  const session = useGetAdminSession();
  const login = useLoginAdmin();
  const logout = useLogoutAdmin();
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    login.mutate({ data: { email, password } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() }),
      onError: (error) => setLoginError(apiErrorMessage(error) ?? 'Those sign-in details could not be confirmed. Please try again.'),
    });
  };
  const signOut = () => logout.mutate(undefined, { onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
    queryClient.removeQueries({ queryKey: getGetAdminContentQueryKey() });
  } });
  if (session.isLoading) return <div className="admin-shell"><div className="admin-wrap"><div className="admin-skeleton" role="status" data-testid="status-session-loading">Checking your session…</div></div></div>;
  if (session.data?.authenticated) return <Editor onSignOut={signOut} signingOut={logout.isPending} />;
  return <div className="admin-shell"><main className="admin-login">
    <p className="admin-eyebrow">Ashfa Aqeel · Private</p><h1 className="admin-heading">A quiet place to edit.</h1>
    <p className="admin-intro">Sign in to update the stories, work, and details on this site.</p>
    {session.isError && <p className="admin-notice" role="status">Your session has ended. Sign in to continue.</p>}
    <form onSubmit={onLogin} data-testid="form-admin-login">
      <div className="admin-field"><label htmlFor="admin-email">Email</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} data-testid="input-admin-email" /></div>
      <div className="admin-field"><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} data-testid="input-admin-password" /></div>
      {loginError && <p className="admin-error" role="alert" data-testid="status-login-error">{loginError}</p>}
      <div className="admin-actions"><button className="admin-button primary" disabled={login.isPending} type="submit" data-testid="button-admin-sign-in">{login.isPending ? 'Signing in…' : 'Sign in'}</button></div>
    </form>
  </main></div>;
}

function Editor({ onSignOut, signingOut }: { onSignOut: () => void; signingOut: boolean }) {
  const queryClient = useQueryClient();
  const contentQuery = useGetAdminContent();
  const update = useUpdateAdminContent();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [section, setSection] = useState<Section>('story');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (contentQuery.data) setContent(contentQuery.data);
  }, [contentQuery.data]);
  const change = (next: SiteContent) => { setContent(next); setNotice('Unsaved changes'); };
  const save = () => {
    if (!content) return;
    setNotice('');
    update.mutate({ data: content }, {
      onSuccess: () => {
        setNotice('Saved. The public site is up to date.');
        queryClient.invalidateQueries({ queryKey: getGetAdminContentQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPublicContentQueryKey() });
      },
      onError: () => setNotice('Your changes could not be saved. Please try again.'),
    });
  };
  if (contentQuery.isLoading || !content) return <div className="admin-shell"><div className="admin-wrap"><div className="admin-top"><div><p className="admin-eyebrow">Private editor</p><h1 className="admin-heading">Your website</h1></div></div>{contentQuery.isError ? <div className="admin-notice" role="alert">The editor content could not be loaded. <button className="admin-button" onClick={() => contentQuery.refetch()} data-testid="button-retry-content">Try again</button></div> : <div className="admin-skeleton" role="status" data-testid="status-content-loading">Opening your editor…</div>}</div></div>;
  return <div className="admin-shell"><div className="admin-wrap">
    <header className="admin-top"><div><p className="admin-eyebrow">Ashfa Aqeel · Private editor</p><h1 className="admin-heading">Your website</h1><p className="admin-intro">A calm corner for keeping things current.</p></div><button className="admin-button" onClick={onSignOut} disabled={signingOut} data-testid="button-admin-sign-out">{signingOut ? 'Signing out…' : 'Sign out'}</button></header>
    <div className="admin-toolbar"><div className="admin-tabs" role="tablist" aria-label="Content editor">{sections.map((item) => <button key={item.id} role="tab" aria-selected={section === item.id} className="admin-tab" onClick={() => setSection(item.id)} data-testid={`tab-admin-${item.id}`}>{item.label}</button>)}</div></div>
    <div className="admin-actions admin-save-row"><button className="admin-button primary" onClick={save} disabled={update.isPending} data-testid="button-save-content">{update.isPending ? 'Saving…' : 'Save changes'}</button><span className="admin-status" role="status" data-testid="status-save">{notice}</span></div>
    {section === 'story' && <section className="admin-panel" aria-labelledby="editor-story-title"><h2 className="admin-section-title" id="editor-story-title">Homepage story</h2><p className="admin-hint">The words and details that make the homepage yours.</p>
      <div className="admin-field"><label htmlFor="profile-name">Name</label><input id="profile-name" value={content.profile.name} onChange={(e) => change({ ...content, profile: { ...content.profile, name: e.target.value } })} data-testid="input-profile-name" /></div>
      <div className="admin-field"><label htmlFor="profile-intro">Background story</label><textarea id="profile-intro" value={content.profile.introduction} onChange={(e) => change({ ...content, profile: { ...content.profile, introduction: e.target.value } })} data-testid="textarea-profile-introduction" /></div>
      <Group title="Journey" addLabel="Add milestone" onAdd={() => change({ ...content, profile: { ...content.profile, journey: [...content.profile.journey, { age: '', milestone: '' }] } })} testId="journey">
        {content.profile.journey.map((item, index) => <div className="admin-card" key={`journey-${index}`}><div className="admin-inline"><Field label="Age" value={item.age} testId={`input-journey-age-${index}`} onChange={(age) => change({ ...content, profile: { ...content.profile, journey: content.profile.journey.map((row, i) => i === index ? { ...row, age } : row) } })} /><Field label="Milestone" value={item.milestone} testId={`input-journey-milestone-${index}`} onChange={(milestone) => change({ ...content, profile: { ...content.profile, journey: content.profile.journey.map((row, i) => i === index ? { ...row, milestone } : row) } })} /></div><button className="admin-button danger" onClick={() => change({ ...content, profile: { ...content.profile, journey: content.profile.journey.filter((_, i) => i !== index) } })} data-testid={`button-remove-journey-${index}`}>Remove row</button></div>)}
      </Group>
      <Group title="Interests" addLabel="Add interest" onAdd={() => change({ ...content, profile: { ...content.profile, interests: [...content.profile.interests, ''] } })} testId="interest">
        {content.profile.interests.map((item, index) => <div className="admin-inline admin-list-row" key={`interest-${index}`}><Field label={`Interest ${index + 1}`} value={item} testId={`input-interest-${index}`} onChange={(value) => change({ ...content, profile: { ...content.profile, interests: content.profile.interests.map((row, i) => i === index ? value : row) } })} /><button className="admin-button danger" onClick={() => change({ ...content, profile: { ...content.profile, interests: content.profile.interests.filter((_, i) => i !== index) } })} data-testid={`button-remove-interest-${index}`}>Remove</button></div>)}
      </Group>
      <Group title="Places to find me" addLabel="Add social link" onAdd={() => change({ ...content, profile: { ...content.profile, placesToFindMe: [...content.profile.placesToFindMe, { platform: '', label: '', href: '' }] } })} testId="social">
        {content.profile.placesToFindMe.map((place, index) => <div className="admin-card" key={`social-${index}`}><div className="admin-grid"><Field label="Platform" value={place.platform} testId={`input-social-platform-${index}`} onChange={(platform) => change({ ...content, profile: { ...content.profile, placesToFindMe: content.profile.placesToFindMe.map((row, i) => i === index ? { ...row, platform } : row) } })} /><Field label="Label" value={place.label} testId={`input-social-label-${index}`} onChange={(label) => change({ ...content, profile: { ...content.profile, placesToFindMe: content.profile.placesToFindMe.map((row, i) => i === index ? { ...row, label } : row) } })} /><Field label="Link" value={place.href} testId={`input-social-href-${index}`} onChange={(href) => change({ ...content, profile: { ...content.profile, placesToFindMe: content.profile.placesToFindMe.map((row, i) => i === index ? { ...row, href } : row) } })} /></div><button className="admin-button danger" onClick={() => change({ ...content, profile: { ...content.profile, placesToFindMe: content.profile.placesToFindMe.filter((_, i) => i !== index) } })} data-testid={`button-remove-social-${index}`}>Remove link</button></div>)}
      </Group>
      <div className="admin-preview"><p className="admin-eyebrow">Preview</p><h3>{content.profile.name}</h3>{content.profile.introduction.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p className="prose-copy" key={index}>{paragraph}</p>)}</div>
    </section>}
    {section === 'posts' && <section className="admin-panel"><h2 className="admin-section-title">Writing</h2><p className="admin-hint">Drafts stay private until published.</p><button className="admin-button" onClick={() => change({ ...content, posts: [...content.posts, { id: makeId(), title: '', slug: '', date: '', description: '', body: '', published: false }] })} data-testid="button-add-post">Add writing</button>
      {content.posts.length === 0 && <div className="admin-empty" data-testid="status-admin-posts-empty">No writing yet.</div>}
      {content.posts.map((post, index) => <article className="admin-card" key={post.id} data-testid={`card-admin-post-${post.id}`}><div className="admin-card-head"><h3 className="admin-card-title">{post.title || 'Untitled writing'}</h3><span className={`admin-badge ${post.published ? 'live' : ''}`}>{post.published ? 'Published' : 'Unpublished'}</span></div><div className="admin-grid"><Field label="Title" value={post.title} testId={`input-post-title-${post.id}`} onChange={(title) => change({ ...content, posts: content.posts.map((item) => item.id === post.id ? { ...item, title } : item) })} /><Field label="Slug" value={post.slug} testId={`input-post-slug-${post.id}`} onChange={(slug) => change({ ...content, posts: content.posts.map((item) => item.id === post.id ? { ...item, slug } : item) })} /><Field label="Date" value={post.date} testId={`input-post-date-${post.id}`} onChange={(date) => change({ ...content, posts: content.posts.map((item) => item.id === post.id ? { ...item, date } : item) })} /><Field label="Description" value={post.description} testId={`input-post-description-${post.id}`} onChange={(description) => change({ ...content, posts: content.posts.map((item) => item.id === post.id ? { ...item, description } : item) })} /></div><div className="admin-field"><label htmlFor={`body-post-${post.id}`}>Body · Markdown-friendly</label><textarea id={`body-post-${post.id}`} value={post.body} onChange={(e) => change({ ...content, posts: content.posts.map((item) => item.id === post.id ? { ...item, body: e.target.value } : item) })} data-testid={`textarea-post-body-${post.id}`} /></div><div className="admin-actions"><button className="admin-button" onClick={() => change({ ...content, posts: content.posts.map((item) => item.id === post.id ? { ...item, published: !item.published } : item) })} data-testid={`button-toggle-post-${post.id}`}>{post.published ? 'Unpublish' : 'Publish'}</button><button className="admin-button danger" onClick={() => { if (window.confirm('Remove this writing from the editor?')) change({ ...content, posts: content.posts.filter((item) => item.id !== post.id) }); }} data-testid={`button-delete-post-${post.id}`}>Delete</button></div></article>)}
    </section>}
    {section === 'studies' && <section className="admin-panel"><h2 className="admin-section-title">Case studies</h2><p className="admin-hint">Keep project details concise and useful.</p><button className="admin-button" onClick={() => change({ ...content, caseStudies: [...content.caseStudies, { id: makeId(), title: '', slug: '', year: null, description: '', body: '', href: '', published: false }] })} data-testid="button-add-study">Add case study</button>
      {content.caseStudies.length === 0 && <div className="admin-empty" data-testid="status-admin-studies-empty">No case studies yet.</div>}
      {content.caseStudies.map((study) => <article className="admin-card" key={study.id} data-testid={`card-admin-study-${study.id}`}><div className="admin-card-head"><h3 className="admin-card-title">{study.title || 'Untitled case study'}</h3><span className={`admin-badge ${study.published ? 'live' : ''}`}>{study.published ? 'Published' : 'Unpublished'}</span></div><div className="admin-grid"><Field label="Title" value={study.title} testId={`input-study-title-${study.id}`} onChange={(title) => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, title } : item) })} /><Field label="Slug" value={study.slug} testId={`input-study-slug-${study.id}`} onChange={(slug) => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, slug } : item) })} /><Field label="Year" type="number" value={study.year ?? ''} testId={`input-study-year-${study.id}`} onChange={(value) => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, year: value ? Number(value) : null } : item) })} /><Field label="External link" value={study.href} testId={`input-study-href-${study.id}`} onChange={(href) => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, href } : item) })} /></div><div className="admin-field"><label htmlFor={`description-study-${study.id}`}>Description</label><textarea id={`description-study-${study.id}`} value={study.description} onChange={(e) => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, description: e.target.value } : item) })} data-testid={`textarea-study-description-${study.id}`} /></div><div className="admin-field"><label htmlFor={`body-study-${study.id}`}>Body · Markdown-friendly</label><textarea id={`body-study-${study.id}`} value={study.body} onChange={(e) => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, body: e.target.value } : item) })} data-testid={`textarea-study-body-${study.id}`} /></div><div className="admin-actions"><button className="admin-button" onClick={() => change({ ...content, caseStudies: content.caseStudies.map((item) => item.id === study.id ? { ...item, published: !item.published } : item) })} data-testid={`button-toggle-study-${study.id}`}>{study.published ? 'Unpublish' : 'Publish'}</button><button className="admin-button danger" onClick={() => { if (window.confirm('Remove this case study from the editor?')) change({ ...content, caseStudies: content.caseStudies.filter((item) => item.id !== study.id) }); }} data-testid={`button-delete-study-${study.id}`}>Delete</button></div></article>)}
    </section>}
    {section === 'books' && <section className="admin-panel"><h2 className="admin-section-title">Books</h2><p className="admin-hint">A shelf of titles you choose to share.</p><button className="admin-button" onClick={() => change({ ...content, books: [...content.books, { id: makeId(), title: '', author: '', note: '', href: '', published: false }] })} data-testid="button-add-book">Add a book</button>
      {content.books.length === 0 && <div className="admin-empty" data-testid="status-admin-books-empty">The shelf is empty.</div>}
      {content.books.map((book) => <article className="admin-card" key={book.id} data-testid={`card-admin-book-${book.id}`}><div className="admin-card-head"><h3 className="admin-card-title">{book.title || 'Untitled book'}</h3><span className={`admin-badge ${book.published ? 'live' : ''}`}>{book.published ? 'Published' : 'Unpublished'}</span></div><div className="admin-grid"><Field label="Title" value={book.title} testId={`input-book-title-${book.id}`} onChange={(title) => change({ ...content, books: content.books.map((item) => item.id === book.id ? { ...item, title } : item) })} /><Field label="Author" value={book.author} testId={`input-book-author-${book.id}`} onChange={(author) => change({ ...content, books: content.books.map((item) => item.id === book.id ? { ...item, author } : item) })} /><Field label="Link" value={book.href} testId={`input-book-href-${book.id}`} onChange={(href) => change({ ...content, books: content.books.map((item) => item.id === book.id ? { ...item, href } : item) })} /></div><div className="admin-field"><label htmlFor={`note-book-${book.id}`}>Note</label><textarea id={`note-book-${book.id}`} value={book.note} onChange={(e) => change({ ...content, books: content.books.map((item) => item.id === book.id ? { ...item, note: e.target.value } : item) })} data-testid={`textarea-book-note-${book.id}`} /></div><div className="admin-actions"><button className="admin-button" onClick={() => change({ ...content, books: content.books.map((item) => item.id === book.id ? { ...item, published: !item.published } : item) })} data-testid={`button-toggle-book-${book.id}`}>{book.published ? 'Unpublish' : 'Publish'}</button><button className="admin-button danger" onClick={() => { if (window.confirm('Remove this book from the editor?')) change({ ...content, books: content.books.filter((item) => item.id !== book.id) }); }} data-testid={`button-delete-book-${book.id}`}>Remove</button></div></article>)}
    </section>}
    {section === 'appearance' && <section className="admin-panel"><h2 className="admin-section-title">Appearance</h2><p className="admin-hint">Small adjustments to the public pages’ typography and color.</p><div className="admin-grid">
      <ColorField label="Background color" value={content.appearance.backgroundColor} testId="input-appearance-background" onChange={(backgroundColor) => change({ ...content, appearance: { ...content.appearance, backgroundColor } })} />
      <ColorField label="Text color" value={content.appearance.textColor} testId="input-appearance-text" onChange={(textColor) => change({ ...content, appearance: { ...content.appearance, textColor } })} />
      <ColorField label="Accent color" value={content.appearance.accentColor} testId="input-appearance-accent" onChange={(accentColor) => change({ ...content, appearance: { ...content.appearance, accentColor } })} />
      <div className="admin-field"><label htmlFor="appearance-font">Typeface</label><select id="appearance-font" value={content.appearance.font} onChange={(e) => change({ ...content, appearance: { ...content.appearance, font: e.target.value as SiteContent['appearance']['font'] } })} data-testid="select-appearance-font"><option value="system">Sans serif</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></div>
      <div className="admin-field"><label htmlFor="appearance-width">Content width · {content.appearance.contentWidth}px</label><input id="appearance-width" type="range" min="480" max="1000" step="10" value={content.appearance.contentWidth} onChange={(e) => change({ ...content, appearance: { ...content.appearance, contentWidth: Number(e.target.value) } })} data-testid="input-appearance-width" /></div>
    </div><div className="admin-preview" style={{ backgroundColor: content.appearance.backgroundColor, color: content.appearance.textColor, maxWidth: content.appearance.contentWidth }}><p className="admin-eyebrow">Preview</p><h3 style={{ color: content.appearance.accentColor }}>A little change in tone.</h3><p>This is how the site’s colors and type settings come together.</p></div></section>}
  </div></div>;
}

function Group({ title, addLabel, onAdd, children, testId }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode; testId: string }) {
  return <section className="admin-group"><div className="admin-group-head"><h3 className="admin-section-title">{title}</h3><button className="admin-button" onClick={onAdd} data-testid={`button-add-${testId}`}>{addLabel}</button></div>{children}</section>;
}

function Field({ label, value, onChange, testId, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; testId: string; type?: string }) {
  return <div className="admin-field"><label htmlFor={testId}>{label}</label><input id={testId} type={type} value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId} /></div>;
}

function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (value: string) => void; testId: string }) {
  return <div className="admin-field"><label htmlFor={testId}>{label}</label><div className="admin-color-input"><input id={testId} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#587b79'} onChange={(event) => onChange(event.target.value)} data-testid={testId} /><input aria-label={`${label} hex value`} value={value} onChange={(event) => onChange(event.target.value)} data-testid={`${testId}-text`} /></div></div>;
}

export default Admin;
