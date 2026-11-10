# Ashfa Aqeel personal website

The site uses React, TypeScript, and Vite. Website content is stored in PostgreSQL and edited through the private `/admin` page; the public pages never display instructional placeholders or unpublished drafts.

## Edit the website

1. Open `/admin` in the site preview.
2. Sign in with the single admin email and password configured in project Secrets.
3. Edit the homepage story, milestones, interests, links, writing, case studies, books, or appearance.
4. Choose whether entries are published, then select **Save changes**. Public pages update from the saved database content.

The editor uses plain forms and Markdown-friendly text areas. A password must be at least 12 characters. The API uses an HttpOnly, signed session cookie; admin writes are checked on the server. Content is not stored in browser local storage.

## Local development

The Replit web and API workflows use the project's development PostgreSQL database. If the schema ever needs to be created again, run:

```sh
pnpm --filter @workspace/db run push
```

The first public content request creates an empty profile with Ashfa's name and empty content collections. Add personal details only through the editor.

## GitHub and Vercel (not connected yet)

The root `vercel.json` builds the existing Vite website and routes `/api/*` to the Express API function. To deploy later:

1. In Replit's Git pane, connect GitHub and push this repository.
2. Import the repository in Vercel, keeping the project root at the repository root.
3. Create or select a PostgreSQL database that is reachable from Vercel, then set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in Vercel's environment settings. The Replit-managed database is scoped to Replit and cannot be used by Vercel; use an external PostgreSQL provider for deployment.
4. Apply the database schema against that external database with `pnpm --filter @workspace/db run push`, then publish through Vercel.
5. After deployment, add `ashfa-aqeel.page` in Vercel's domain settings and apply the DNS records Vercel provides at your registrar.

No GitHub repository, external database, Vercel deployment, or domain settings were changed for this work.
