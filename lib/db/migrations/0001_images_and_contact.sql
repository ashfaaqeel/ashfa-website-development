-- Additive, idempotent migration. Does not touch the existing site_content table.
-- Equivalent to running: pnpm --filter @workspace/db run push

CREATE TABLE IF NOT EXISTS uploaded_images (
  id           text PRIMARY KEY,
  content_type text NOT NULL,
  data         bytea NOT NULL,
  size         integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  message     text NOT NULL,
  ip_hash     text NOT NULL DEFAULT '',
  emailed     boolean NOT NULL DEFAULT false,
  email_error text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_ip_created_idx
  ON contact_messages (ip_hash, created_at);
