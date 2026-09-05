This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deployment risk: Playwright is a runtime dependency, not just a test tool

`playwright` was originally installed as a devDependency for E2E browser
testing during development. As of Cabang 4b (performance report PDF
export, `src/app/api/exports/performance/pdf/route.ts`), it is used **at
runtime** — a Next.js Server Action / route handler launches Playwright's
Chromium to render an HTML report to PDF (`page.pdf()`). It was moved from
`devDependencies` to `dependencies` in `package.json` for this reason.

**Why Playwright instead of `puppeteer`**: Playwright's Chromium binary
(~700MB) was already being downloaded for E2E testing. Installing
`puppeteer` would download a *second*, separate Chromium binary for the
same job — pure duplication. Reusing the browser already present avoids
that.

**Unconfirmed for production — verify before deploying**: this project has
no `vercel.json` or `Dockerfile` at the time this note was written, so the
production deploy story is unknown. Two things must hold true wherever
this is deployed, or the PDF export will fail at runtime even though local
dev works fine:

1. The install step must actually run Playwright's browser-download
   postinstall hook. Some CI/deploy pipelines set
   `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` or prune caches after install —
   either would leave the Chromium binary missing in production.
2. The runtime environment needs the OS-level shared libraries headless
   Chromium depends on (this matters especially for minimal/slim container
   images — Playwright's own docs list the required packages per OS).

If neither can be guaranteed, the fallback is a pure-JS PDF library with
no browser dependency (e.g. `@react-pdf/renderer` or `pdf-lib`), at the
cost of rebuilding the report template in that library's own primitives
instead of plain HTML/CSS.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
