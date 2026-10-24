# C4 Level 2 — Containers (current)

**Sources:** `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`.

One static SPA. Vite serves it in development and builds it for production. There is no worker, no local database, and no print process.

## Diagram

```mermaid
C4Container
title Prime Sweets UI — Containers (current)

Person(seller, "Seller", "Browser user")

Container_Boundary(client, "Prime Sweets UI") {
  Container(spa, "Web application", "Vite 7, React 19, TypeScript, React Router", "Renders the shell. The sale route searches products. Other routes are placeholders")
}

System_Ext(api, "Prime Sweets Core API", "Express process. Default base URL http://localhost:3000")

Rel(seller, spa, "Loads index.html", "HTTPS or HTTP")
Rel(spa, api, "GET /products/search when the seller submits a query", "fetch")
```

## Web application

`npm run dev` starts Vite on port `5173`. `npm run build` runs `tsc -b` and `vite build`.

`src/main.tsx` mounts React on `#root`, builds the composition container, and renders `App`.

Stack: TypeScript ESM, React 19, Vite 7, ESLint 9 flat config, Prettier 3.

## Core API

Configured only. Feature calls are not wired. Authentication headers are not sent because the shell has no session.

## Deployment notes (verified)

| Topic | Current behavior |
|---|---|
| Deployable | Static files from `dist/` after `npm run build`. |
| Runtime data | None stored in the browser. |
| Print | None. |
| Layout | Narrow by default. At `min-width: 64rem` the shell places navigation beside the page. No user-agent check. Feature screens do not yet reflow their own tables. |
