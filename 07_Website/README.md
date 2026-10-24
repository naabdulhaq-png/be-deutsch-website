# Be Deutsch website

The English marketing website for Be Deutsch. This folder contains the W01–W06 website foundation, public pages, Option A production theme, accessibility hardening, SEO assets and release preparation. Public deployment remains a separate W07 action and is never triggered automatically.

## Requirements

- Node.js 22 or newer
- pnpm 11.25.0
- Astro 7.3.5

## Install

From the `07_Website` directory:

```powershell
pnpm install --frozen-lockfile
```

For the first install before a lockfile exists, use `pnpm install`.

## Develop

```powershell
pnpm dev
```

Astro prints the local URL, normally `http://localhost:4321/`.

## Build

```powershell
pnpm build
```

The static site is written to `dist/`. The build runs Astro's TypeScript/content checks before generating the site.

This ordinary build is intended for local development and review. It does not override the legal release guard.

Validate built routes, metadata, internal links, sitemap and release-safe URLs with:

```powershell
pnpm check:site
```

Check the pinned dependency graph for known vulnerabilities with:

```powershell
pnpm audit --audit-level low
```

Generate the committed Open Graph image and favicon PNG derivatives from the approved website icon with:

```powershell
pnpm assets:generate
```

## Production release preflight

The legal provider details are centralized in `src/config/legal.json`. The prepared GitHub Pages workflow and any future W07 release must use:

```powershell
pnpm build:production
```

That command runs `pnpm preflight:production` first and fails whenever `src/config/legal.json` contains missing or unconfirmed required legal fields. It then builds and runs the production site validator. Do not bypass this command in a deployment workflow.

## GitHub Pages preparation

The repository-level workflow `.github/workflows/be-deutsch-pages.yml` is intentionally manual-only through `workflow_dispatch`. It is not triggered by pushes. Its build job runs the legal guard before it can upload or deploy a Pages artifact.

W07 activation sequence:

1. Obtain founder confirmation of the exact rendered German and English Impressum provider blocks.
2. Verify repository visibility and the account plan support GitHub Pages.
3. Configure GitHub Pages to use GitHub Actions and verify `www.bedeutsch.de` in the repository settings.
4. Make the required STRATO DNS changes without altering email MX records.
5. Manually run the prepared workflow and verify the deployment.

The committed `public/CNAME` prepares `www.bedeutsch.de` inside the future Pages artifact. It does not change DNS or activate the custom domain by itself.

## Preview the production build

```powershell
pnpm preview
```

Astro prints the local preview URL, normally `http://localhost:4321/`.

## Project conventions

- English is served at `/`. Persian/Farsi is registered as a future, disabled locale in `src/config/site.ts`; no `/fa/` route exists yet.
- Current routes are `/`, `/app/`, `/testing/`, `/about/`, `/partners/`, `/support/`, `/privacy/` and `/impressum/`, plus the static 404 page. FAQ remains on `/support/`.
- App availability and verified testing destinations are centralized in `src/config/site.ts`. As verified on 24 October 2026, version 2.0.0 (code 4) is active in the Be Deutsch closed-testing track. The homepage leads to `/testing/`, which explains Google Group membership, Play opt-in and installation using the same Google account. General public production release is unavailable; `googlePlayUrl` remains null and is separate from `testingOptInUrl`.
- Reverify the closed track, tester-group access and invitation before publishing a status update. The website has no registration form, account database or direct collection of tester email addresses. Google handles group membership and opt-in; support email is the feedback route.
- Shared layout and interface pieces live in `src/layouts` and `src/components`.
- Brand tokens and responsive rules live in `src/styles/global.css`.
- The canonical production origin is `https://www.bedeutsch.de/`; every public page emits tailored title, description, canonical and social metadata.
- `robots.txt` references the generated Astro sitemap. The sitemap excludes the 404 page, disabled locales and preview routes.
- The homepage emits truthful `WebSite` structured data. The App page emits `SoftwareApplication` data without ratings, reviews, pricing or store-availability claims.
- Approved brand artwork and production screenshots are copied into `src/assets`. Astro produces responsive AVIF/WebP derivatives at build time; do not edit the Android source assets.
- Public provider/contact details and legal-release status are centralized in `src/config/legal.json` and exposed to components through `src/config/site.ts`.
- Use semantic HTML, logical CSS properties, descriptive alternative text and visible keyboard focus in new work.
- Do not add external fonts, analytics, tracking, embeds, cookies, browser storage or third-party scripts without an approved change in scope.
