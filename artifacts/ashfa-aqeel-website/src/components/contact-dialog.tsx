import { createContext, useCallback, useContext, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSendContactMessage } from '@workspace/api-client-react';
import type { ContactSettings } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

type ContactContextValue = { openContact: () => void };
const ContactContext = createContext<ContactContextValue>({ openContact: () => undefined });
export const useContactDialog = () => useContext(ContactContext);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

function serverMessage(error: unknown): string {
  const data = (error as { data?: { error?: unknown } } | null)?.data;
  return typeof data?.error === 'string' ? data.error : 'Your message could not be sent. Please try again in a moment.';
}

export function ContactProvider({ children, settings }: { children: ReactNode; settings?: ContactSettings }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);
  const send = useSendContactMessage();

  // The dialog is opened programmatically (no DialogTrigger), so remember the opener
  // and give it focus back on close, as keyboard and screen-reader users expect.
  const opener = useRef<HTMLElement | null>(null);
  const openContact = useCallback(() => {
    if (settings?.mode === 'mailto' && settings.email) {
      window.location.href = `mailto:${settings.email}`;
      return;
    }
    if (settings?.mode === 'url' && settings.url) {
      window.location.href = settings.url;
      return;
    }
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, [settings]);
  const value = useMemo(() => ({ openContact }), [openContact]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Keep what was typed unless the message went through.
      setErrors({});
      setSendError('');
      if (sent) {
        setSent(false);
        setName(''); setEmail(''); setMessage('');
        send.reset();
      }
    }
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Please tell me your name.';
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (message.trim().length < 10) next.message = 'Please write at least a few words (10 characters).';
    return next;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setSendError('');
    if (Object.keys(found).length > 0) return;
    send.mutate(
      { data: { name: name.trim(), email: email.trim(), message: message.trim(), website } },
      {
        onSuccess: () => setSent(true),
        onError: (error) => setSendError(serverMessage(error)),
      },
    );
  };

  return (
    <ContactContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="contact-dialog"
          data-testid="dialog-contact"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          {sent ? (
            <div role="status" data-testid="status-contact-success">
              <DialogTitle className="contact-title">Thank you.</DialogTitle>
              <DialogDescription className="contact-intro">
                Your message has been sent. I’ll reply to {email.trim()} when I can.
              </DialogDescription>
              <div className="contact-actions">
                <button type="button" className="contact-button primary" onClick={() => onOpenChange(false)} data-testid="button-contact-done">Close</button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate data-testid="form-contact">
              <DialogTitle className="contact-title">Say hello</DialogTitle>
              <DialogDescription className="contact-intro">A note, a question or an idea is welcome.</DialogDescription>

              <div className="contact-field">
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined} data-testid="input-contact-name" />
                {errors.name && <p id="contact-name-error" className="contact-error" role="alert" data-testid="error-contact-name">{errors.name}</p>}
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined} data-testid="input-contact-email" />
                {errors.email && <p id="contact-email-error" className="contact-error" role="alert" data-testid="error-contact-email">{errors.email}</p>}
              </div>
              <div className="contact-field">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" rows={5} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : undefined} data-testid="input-contact-message" />
                {errors.message && <p id="contact-message-error" className="contact-error" role="alert" data-testid="error-contact-message">{errors.message}</p>}
              </div>
              {/* Honeypot: hidden from people and assistive tech, filled in only by bots. */}
              <div className="contact-trap" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              {sendError && <p className="contact-error contact-send-error" role="alert" data-testid="error-contact-send">{sendError}</p>}
              <div className="contact-actions">
                <button type="submit" className="contact-button primary" disabled={send.isPending} data-testid="button-contact-send">{send.isPending ? 'Sending…' : 'Send message'}</button>
                <button type="button" className="contact-button" onClick={() => onOpenChange(false)}>Cancel</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ContactContext.Provider>
  );
}
