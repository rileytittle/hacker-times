# Hacker Times

A calmer, more readable way to read Hacker News. Built with Next.js (App Router, Cache Components).

## What it does

- **Story lists** (`/`, `/new`, `/best`, `/ask`, `/show`, `/jobs`): scannable rows with favicon, title, domain, points and a prominent comment count. Clicking a title opens the thread; the domain link (↗) goes straight to the article.
- **Top of the Week** (`/week`, `/week/YYYY-MM-DD`): the most upvoted stories posted in a given Monday–Sunday week (UTC), with previous/next navigation back to HN's first week. Any date redirects to its week's Monday.
- **Thread page** (`/item/:id`): the linked article as a preview card at the top, then the full comment tree, built for reading:
  - ~70-character line length, 17px serif body text, AA-contrast metadata
  - clickable thread rails: click the line beside a comment to collapse it and its replies ("show +N replies")
  - OP badge on the story author's comments; `> quoted` lines styled as quotes
  - comments posted since your last visit are marked **new** (stored in `localStorage`)
  - keyboard: `j`/`k` next/previous comment, `n`/`p` next/previous top-level thread, `x` collapse
  - Collapse all / Expand all, and a sticky outline of top-level threads in the sidebar on wide screens
- Light and dark themes follow the OS setting.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How data flows

| Data | Source | Cache (`cacheLife`) |
| --- | --- | --- |
| Feed IDs & items | [HN Firebase API](https://github.com/HackerNews/API) | `minutes` |
| Comment trees | [Algolia HN API](https://hn.algolia.com/api) `/items/:id` (one request per story); falls back to walking Firebase (capped at 200 comments) when Algolia hasn't indexed the item yet | `minutes` |
| Top of the Week | Algolia `/search` filtered by `created_at_i` to the week, ranked by points | `minutes` for the current week, `days` for past weeks |
| Link previews (og:image/title/description) | Fetched server-side from the story URL (4s timeout, reads only `<head>`, max 512KB) | `days` |
| Favicons | `icons.duckduckgo.com`, loaded by the browser | n/a |

See `src/lib/hn.ts` and `src/lib/preview.ts`.

Comment and self-post HTML from HN is sanitized with an allow-list (`src/lib/sanitize.ts`), and links to `news.ycombinator.com/item?id=…` are rewritten to stay in the app.

The comment tree is server-rendered HTML. The only client JS on the thread page is `ThreadControls`, which adds collapse, keyboard navigation and "new" highlighting through event delegation.

The link previewer only fetches public `http(s)` hosts (literal private/loopback IPs and `localhost` are rejected, and every redirect is re-checked). It does not resolve DNS, so a public hostname that points at a private IP isn't caught. Keep that in mind if you deploy somewhere with sensitive internal services.

## Environment variables (all optional)

| Var | Default | Purpose |
| --- | --- | --- |
| `HN_API_BASE` | `https://hacker-news.firebaseio.com/v0` | Firebase API base |
| `HN_ALGOLIA_BASE` | `https://hn.algolia.com/api/v1` | Algolia API base |
| `LINK_PREVIEW_ALLOW_PRIVATE_HOSTS` | unset | Set to `1` in **dev only** to let the previewer hit `localhost` (e.g. a mock server). Ignored in production. |
