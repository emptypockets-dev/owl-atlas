# Owl Atlas launch status — 16 September 2026

The existing research edition is deployed to the verified personal Vercel account
**emptypockets-dev**, in **emptypocketsdev's projects**. It remains restricted to
authenticated Vercel access while the six BnF image reuse decisions are unresolved.
The account's existing Pro plan was retained; no plan upgrade or paid add-on was added.

- Current preview: https://owl-atlas-l5aezhinv-emptypocketsdevs-projects.vercel.app
- Vercel project: https://vercel.com/emptypocketsdevs-projects/owl-atlas
- Public source repository: https://github.com/emptypockets-dev/owl-atlas

Sign in with the personal Vercel account `emptypockets-dev` to view the preview.

**Account correction:** the initial deployment mistakenly selected a similarly
named Hobby workspace belonging to the work-associated login. On 16 September
2026, the existing project and deployments were transferred to the verified
personal account. The API confirmed the new owner and removal from the previous
workspace. The existing preview was opened successfully in the user's already
signed-in personal browser session. The current preview above was subsequently
deployed directly under the personal workspace.
Unauthenticated requests redirect to Vercel authentication. All deployments,
including the stable `owl-atlas.vercel.app` address, are protected. Vercel assigned
its first deployment to production despite an explicit preview target; all URLs
were then protected immediately, and a separate preview was created. The stable
address currently retains that initial build; use the current preview above for
the corrected Met dimension metadata and complete pairs of family-tree photographs.

## Deployment configuration

`vercel.json` uses the original `npm run build:deploy` command, skips dependency
installation, and publishes only `dist/`. No framework, runtime service, paid
resource, domain purchase, tracking or analytics was added. The preview serves
`X-Robots-Tag: noindex, nofollow`. Git-triggered deployments are deliberately
turned off until the public-release decision is recorded.

The source was successfully pushed to `emptypockets-dev/owl-atlas` on `main`.
After the account transfer, Vercel successfully connected that GitHub repository;
the earlier access error is resolved. Automatic Git deployments remain disabled
by `vercel.json` pending the public-release decision.

For future CLI operations, use the project-local personal-account login and an
explicit scope, without changing the machine's default work-account login:

```sh
vercel whoami --global-config .vercel/personal-cli
vercel deploy --target preview --scope emptypocketsdevs-projects --global-config .vercel/personal-cli
```

The expected username is `emptypockets-dev`. Verify the account identity before
any mutation. If that local login is missing on another machine, sign in to the
personal account first. `.vercel/` and `.env.local` contain local configuration
and credentials and must remain excluded from Git.

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
- At the owner's request, family-tree cards now show labeled obverse and reverse
  photographs side by side, including on mobile. Existing side-specific crops,
  credits, rights notes and full original-image viewer links are preserved.
  A subsequent source check located the exact early-classical reverse,
  Cleveland 1920.267.b, matching the existing 1920.267.a obverse. Both museum
  records explicitly belong to accession 1920.267 and carry a CC0 designation.
  The gap is now filled in the family tree and comparison controls; see
  `research/early-classical-findings.json` for the accession and rights evidence.
- Added the museum's full-resolution 2,384 × 2,280 reverse JPEG for the viewer,
  with its smaller web JPEG (measured at 750 × 717) used on the page. These are
  museum-supplied files; no local image transformation or archiving was performed.
- Added a direct `#family-tree` link. Cards use two columns on desktop and one
  on narrow screens, keeping each coin's two faces together.
- Removed the hero photograph's “Look closer” overlay, retaining the image
  viewer link, visible keyboard focus and attribution.
- Broadened section 01 into a geographic introduction, explicitly placing Athens
  in Attica in present-day Greece. A public-domain coastline map locates selected
  regions across time; the accompanying text distinguishes minting, circulation
  and findspots. Three added sources support the wider distribution and related
  local coinages. This is not an exhaustive inventory of mints or a reconstruction
  of trade routes. See `research/geography-findings.json` for evidence and map credit.

The existing design and interactions are preserved. `src/app.js` still matches
the original package checksum; the page, styles and renderer now include the
requested family-tree and geographic updates. The original 28 sources, 16 image records, three BnF
specimens, six reuse-review flags, dates, attributions and existing image URLs
remain. The documented early-classical reverse brings the image total to 17.
The geographic references bring the source total to 31.
`MANIFEST.sha256` and `research/handoff-validation.json` describe the original
handoff package, not this later deployment.

## Verification

- `npm run build:deploy`: passed locally and on Vercel; output is `dist/`.
- `npm run check`: 914 checks passed.
- `python3 tests/integration_data.py`: 91 checks passed.
- `python3 tests/editorial_copy.py`: 28 checks passed.
- Chromium smoke suite: see `research/browser-qa.json` (152 checks; image requests
  intentionally blocked). Playwright was run from an isolated temporary tooling
  environment, with no dependency added to this project.
- Current geography HTTPS preview: see `research/geography-qa.json`. All 43 checks
  passed: exact hosted HTML equality with `dist/index.html`, the section deep link,
  map labels and text, viewport fit at 320, 390, 768, 1024 and 1440 pixels, all three
  new citation dialogs and focus return, and no-JavaScript reading. Real hero,
  early-classical reverse and BnF Pi III photographs loaded successfully. The hosted
  desktop layout and mobile screenshots were visually inspected; no page JavaScript
  errors occurred. The map is inline SVG and needs no external map service.
- Previous hero-label HTTPS preview: see `research/hero-label-qa.json`. The 20
  targeted checks verify actual hero/viewer image loading, hidden overlay on
  hover and focus, visible keyboard focus, Enter/Escape and focus return at
  320, 390 and 1440 pixels. Other photograph labels remain visible.
- Previous family-tree HTTPS preview: see `research/family-faces-qa.json` for
  the latest check count and URL. All 16 family-face displays loaded real
  photographs. At 320, 390, 768, 1024 and 1440 pixels, each pair stayed side by
  side with correct crops and no horizontal page overflow. All 16 viewer links
  opened the exact original and returned focus on Escape at 390 pixels. Both
  face slots remained available without JavaScript. The matching early-classical
  reverse also loaded at full resolution in the viewer, linked its exact museum
  record, and appeared correctly in the comparison controls. Hosted HTML exactly matched
  `dist/index.html`, and the new section link resolved. The hosted desktop and
  mobile photographs were visually inspected.
- Earlier launch preview: 255 checks passed; see `research/hosted-preview-qa.json`. Every one of the
  16 real remote photographs loaded and decoded. Each was visually inspected in
  the hosted viewer, including all six full-frame BnF faces and the paired plates.
  The Met dimension mismatch discovered in the first run was corrected.
- Those earlier hosted checks cover exact HTML equality with `dist/index.html`, source and
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
   indexing restrictions, and deliberately enable the intended Git deployment
   workflow for the now-connected `emptypockets-dev/owl-atlas` repository. Keep
   the previous deployment available for rollback.
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
