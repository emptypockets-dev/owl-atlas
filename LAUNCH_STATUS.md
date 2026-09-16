# Owl Atlas launch status — 16 September 2026

The existing research edition is deployed to the owner's personal Vercel Hobby
workspace, **Andrey Kondratyuk's projects**. It remains restricted to authenticated
Vercel access while the six BnF image reuse decisions are unresolved.

- Current preview: https://owl-atlas-1xw38p25v-andrey-kondratyuks-projects.vercel.app
- Vercel project: https://vercel.com/andrey-kondratyuks-projects/owl-atlas
- Public source repository: https://github.com/emptypockets-dev/owl-atlas

Sign in with the Vercel account that owns the project to view the preview.
Unauthenticated requests redirect to Vercel authentication. All deployments,
including the stable `owl-atlas.vercel.app` address, are protected. Vercel assigned
its first deployment to production despite an explicit preview target; all URLs
were then protected immediately, and a separate preview was created. The stable
address currently retains that initial build; use the current preview above for
the corrected Met dimension metadata.

## Deployment configuration

`vercel.json` uses the original `npm run build:deploy` command, skips dependency
installation, and publishes only `dist/`. No framework, runtime service, paid
resource, domain purchase, tracking or analytics was added. The preview serves
`X-Robots-Tag: noindex, nofollow`. Git-triggered deployments are deliberately
turned off until the public-release decision is recorded.

The source was successfully pushed to `emptypockets-dev/owl-atlas` on `main`.
Vercel's Git connection attempt returned `You need admin or write access to the
repository "owl-atlas" to link it (400)`. The Vercel account's GitHub integration
therefore still needs access to this personal repository. Deployment used the
authenticated Vercel CLI and does not depend on that integration. No GitHub account
connection or organization permissions were changed to bypass this restriction.

The source repository is public by the owner's request. It contains source,
research records and existing QA material; the hosted site exposes only the
built HTML, `LICENSE.txt` and `THIRD_PARTY_NOTICES.txt`. Requests for source,
research files and `.env.local` return 404 after authentication. Local Vercel
settings and credentials are ignored by Git.

## Changes

- Added Vercel deployment settings and ignored its local configuration directory.
- Corrected the Met's two dimension records using images loaded from their
  unchanged source URLs: reverse 1,110 × 1,200; obverse 1,200 × 1,085.
- Updated the third-party notice and generated output through the existing build.
- Recorded launch verification separately from the original handoff report.

`src/page.html`, `src/styles.css`, `src/app.js` and `src/render.mjs` still match
the original package checksums. The 28 sources, 16 image records, three BnF
specimens, six reuse-review flags, dates, attributions and image URLs remain.
`MANIFEST.sha256` and `research/handoff-validation.json` describe the original
handoff package, not this later deployment.

## Verification

- `npm run build:deploy`: passed locally and on Vercel; output is `dist/`.
- `npm run check`: 847 checks passed.
- `python3 tests/integration_data.py`: 85 checks passed.
- `python3 tests/editorial_copy.py`: 28 checks passed.
- Chromium smoke suite: see `research/browser-qa.json` (152 checks; image requests
  intentionally blocked). Playwright was run from an isolated temporary tooling
  environment, with no dependency added to this project.
- Actual HTTPS preview: 255 checks passed; see `research/hosted-preview-qa.json`. Every one of the
  16 real remote photographs loaded and decoded. Each was visually inspected in
  the hosted viewer, including all six full-frame BnF faces and the paired plates.
  The Met dimension mismatch discovered in the first run was corrected.
- Hosted checks cover exact HTML equality with `dist/index.html`, source and
  specimen links, image dimensions, zoom/pan/reset, Escape, source-dialog focus
  return, Pi II/Pi III presets and faces, bibliography filtering, no-JavaScript
  content, reduced motion and section links at 320, 390, 768, 1024 and 1440 pixels.
- Slow-network loading, layout-shift observations and a deliberately failed
  photograph request are recorded in `research/hosted-loading-qa.json`. At 390 px,
  150 ms latency and 200,000 bytes/second, the story remained readable before
  the hero loaded; accumulated layout shift was about 0.015. The three initial
  photographs transferred about 8.6 MB. This is one lab observation, not a
  field-performance/Core Web Vitals certification. Failure fallbacks and source
  links remained usable, and closing the failed-image dialog restored focus.

## Decisions before public release

1. Resolve the intended use of the six BnF/Gallica photographs (Pi II 1469,
   Pi III 1475 and quadridigité 1478, both sides). The Commons PD-France assertion
   is retained alongside BnF's separate reuse conditions. No new permission has
   been obtained. See `THIRD_PARTY_NOTICES.md` and the authoritative image records.
   Keep authentication enabled until this decision is documented.
2. Decide whether the assigned `owl-atlas.vercel.app` address is the final public
   address or whether an already-owned domain should be attached. Then add the
   canonical/social metadata, sitemap and favicon appropriate to that identity.
   No domain was purchased or invented.
3. After the release decision, publish the approved build, remove preview-only
   indexing restrictions, authorize Vercel's GitHub integration for
   `emptypockets-dev/owl-atlas`, reconnect it, and deliberately enable the intended
   Git deployment workflow. Keep the previous deployment available for rollback.
4. Decide whether to archive approved photographs for reliability. Current images
   are remote; no photographs were vendored or optimized. The 8.6 MB initial
   image transfer is a mobile-loading limitation; consider permitted, documented
   page derivatives while keeping full source frames in the viewer. Retain originals and
   per-image credits and license/modification records for any later derivatives.

Specialist numismatic review, the documented coverage gaps, Safari/Firefox,
screen-reader review and real-device touch testing remain outstanding. The checks
are not accessibility certification, rights clearance, authentication advice or a
new independent audit of all historical sources. Existing low-resolution plates
remain honestly identified; no image was fabricated, enhanced or substituted.
