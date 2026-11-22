import { useQueryClient } from '@tanstack/react-query';
import { getListContactMessagesQueryKey, useDeleteContactMessage, useListContactMessages } from '@workspace/api-client-react';

export function MessagesPanel() {
  const queryClient = useQueryClient();
  const messages = useListContactMessages();
  const remove = useDeleteContactMessage();
  const onDelete = (id: number) => {
    if (!window.confirm('Delete this message?')) return;
    remove.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListContactMessagesQueryKey() }) });
  };

  return (
    <section className="admin-panel" data-testid="panel-messages">
      <h2 className="admin-section-title">Messages</h2>
      <p className="admin-hint">Everything sent through the site’s contact form is kept here, even if email delivery is not set up.</p>
      {messages.isLoading && <div className="admin-skeleton" role="status">Loading messages…</div>}
      {messages.isError && <div className="admin-notice" role="alert">Messages could not be loaded. <button className="admin-button" onClick={() => messages.refetch()}>Try again</button></div>}
      {messages.data && messages.data.length === 0 && <div className="admin-empty" data-testid="status-admin-messages-empty">No messages yet.</div>}
      {messages.data?.map((item) => (
        <article className="admin-message" key={item.id} data-testid={`card-admin-message-${item.id}`}>
          <div className="admin-card-head">
            <h3 className="admin-card-title">{item.name}</h3>
            <span className={`admin-badge ${item.emailed ? 'live' : ''}`} title={item.emailError ?? undefined}>{item.emailed ? 'Emailed' : 'Saved only'}</span>
          </div>
          <p className="admin-message-meta"><a href={`mailto:${item.email}`}>{item.email}</a> · {new Date(item.createdAt).toLocaleString()}</p>
          <p className="admin-message-body">{item.message}</p>
          {!item.emailed && item.emailError && <p className="admin-hint">Email not sent: {item.emailError}</p>}
          <div className="admin-actions"><a className="admin-button" href={`mailto:${item.email}`}>Reply</a><button className="admin-button danger" onClick={() => onDelete(item.id)} disabled={remove.isPending} data-testid={`button-delete-message-${item.id}`}>Delete</button></div>
        </article>
      ))}
    </section>
  );
}
