# Owl Atlas launch status — 17 September 2026

The existing research edition is public at **https://theowlatlas.com/** on the
verified personal Vercel account **emptypockets-dev**, in
**emptypocketsdev's projects**. `www.theowlatlas.com` permanently redirects to
that address. HTTPS and anonymous access have been verified.

The owner explicitly chose to retain the six BnF/Gallica photographs with their
existing credits and reuse-review notices. This is a publication decision, not
rights clearance; the six flags remain. See
[research/publication-decision.md](research/publication-decision.md).

- Public site: https://theowlatlas.com/
- Production deployment: https://owl-atlas-ntvdt1smi-emptypocketsdevs-projects.vercel.app
- Latest preview: https://owl-atlas-iam7iz4z4-emptypocketsdevs-projects.vercel.app/
- Previous production / rollback source: https://owl-atlas-1fiujxfos-emptypocketsdevs-projects.vercel.app
- Vercel project: https://vercel.com/emptypocketsdevs-projects/owl-atlas
- Public source repository: https://github.com/emptypockets-dev/owl-atlas

Vercel Standard Protection keeps generated deployment URLs and previews behind
Vercel authentication; the production domain is public. The existing Pro plan
was retained, with no plan upgrade or paid add-on. The domain was purchased
separately by the owner.

## One owl: an imagined life — 17 September 2026

The companion at https://theowlatlas.com/one-owl/ now includes “The gift that
waited,” a four-scene historical-fiction interlude requested by the owner. A
family gift becomes hidden savings, then a rediscovered antiquity and a gift to
an unnamed king. The invented events are visibly labeled; they are not added to
the specimen’s provenance. Sourced collecting history follows, with Augustus,
Petrarch and Louis XIV, plus real hoard and conservation context. Four new
references bring the companion bibliography to twelve.

The production build publishes only `dist/`. All checks passed: 1,750 structural,
91 research data, 28 editorial, 118 companion data, 213 site browser smoke, and
240 companion browser checks both locally and on public HTTPS. The four original
owner photographs load and match their staged bytes. All three public HTML pages
match `dist/`. The authenticated preview and public desktop/mobile reading layouts
were visually inspected. See `research/one-owl-fiction-release-qa.json` and
`research/coin-survival-fiction-notes.md`; the previous companion launch is
recorded separately in `research/one-owl-release-qa.json`.

No new publication decision is pending. The existing BnF notices remain, and
these targeted Chromium checks do not constitute cross-browser or accessibility
certification.

## Typography and usability — 17 September 2026

Both the main story and detailed pricing page received a readability and visual
review. The existing serif headings, colors and editorial layout remain. Regular
narrative is now 16–17px at default browser settings, with supporting text at
13–15px and more generous line spacing. Rem-based sizes respond to larger text
preferences. Image credits, source notes, chart labels, forms and disclosures
have clearer hierarchy and more space; citations have larger targets.

The mobile header now uses two rows with all four destinations and the motion
control visible. Measured navigation heights keep deep links and sticky images
clear when text wraps. The chapter label reserves room for its longest wrapped
entry, preventing chapter changes from covering an anchor destination. Evidence panels use two tablet columns and one mobile
column; comparison panels stack on narrow screens while family cards continue
to show both coin faces together. Dialog content scrolls while its controls stay
reachable. Source lists, long captions, prices and headings wrap without page
overflow. Horizontally scrolling tables have a mobile hint. No-JavaScript pages
use a static header and keep their native disclosures.

All 41 sources, 17 image records, three BnF specimens, 66 market observations,
six reuse-review flags and the approved dotted-theta treatment are unchanged.
No dependency, framework, tracking, font service or new photograph was added.

`npm run build:deploy` passed locally and on the existing personal Vercel project,
publishing only `dist/`. **2,427 local checks passed**: 1,709 structural/rendering,
91 data consistency, 28 editorial, 213 Chromium smoke, 73 pricing and 313 focused
readability checks. The latter cover both pages at 320, 390, 768, 1024 and 1440
CSS pixels, sampled type sizes, navigation targets, source-dialog keyboard use,
200% root-font enlargement, native anchor clearance, increased text spacing and no-JavaScript reading.
The authenticated final HTTPS preview was visually inspected with the real owl
photograph. See `research/readability-qa.json`.

**467 hosted checks passed**: 394 public release checks plus 73 pricing checks.
Both HTTPS pages exactly match the staged HTML. All 17 real page photographs
and all 17 full originals loaded and decoded; dimensions, credits, reuse notices,
keyboard zoom/pan/reset and focus return were verified. Live navigation, deep
links, 320px enlarged-text anchor clearance, source search, pricing filters,
calculator, downloads and no-JavaScript reading passed. Mobile and desktop
photographs and layouts were visually reviewed. See
`research/readability-release-qa.json` and `research/market-hosted-qa.json`.

No new publication decision remains. The owner's earlier BnF decision and all
six reuse-review notices remain. These are targeted Chromium checks, not
cross-browser or accessibility certification. Actual browser zoom, screen-reader
and real-device touch review remain separate work.

## Dotted theta — 17 September 2026

The header and footer logos now use a drawn circle with a central dot for theta,
on both the main story and pricing page. Standard ΑΘΕ remains in prose and
close-reading controls. The identity detail includes the owner's approved
explanation of the coin's dotted theta and the printed Θ. A new Open University
reference supports the ancient letterform; all 40 earlier sources retain their
numbers, bringing the bibliography to 41. Images and rights notices are unchanged.

`npm run build:deploy` passed and Vercel published only `dist/` to the existing
personal project. **2,041 local checks passed**: 1,709 structural/rendering,
91 data consistency, 28 editorial and 213 Chromium smoke checks. The authenticated
HTTPS preview was visually inspected with the real owl photograph. **40 hosted
checks passed** on the public domain: exact output matching for both pages,
header/footer logos, desktop and narrow mobile layouts, keyboard source-dialog
use and focus return, the exact approved copy, both real close-reading coin faces
and their original viewers, and no-JavaScript reading. See
`research/theta-update-qa.json`. Desktop and mobile screenshots were reviewed.
This is targeted verification, not new cross-browser or accessibility certification.
No new publication decision is pending; the six existing BnF reuse-review notices
and the owner's earlier decision remain in effect.

## Pricing page split — 17 September 2026

The main scroll now presents a short “One owl. Many prices” section at
https://theowlatlas.com/#pricing. Three examples show the observed 2026 sample
span of $420–$6,710, with the seven classical Choice XF results in the middle;
a full-crest fact connects price to a visible design detail. The summary stays
under 250 words and distinguishes the sample span from market limits.

The full research chapter moved to https://theowlatlas.com/pricing/, with its
charts, calculator, 66-record ledger, downloads, eight supporting references and
all methodological caveats. Navigation links both pages. The six family pricing
notes now link to the full page. Saved main-page pricing-topic and sale fragments
redirect to the corresponding new location with JavaScript; without it, they
land beside the summary's ordinary link. The original `/#pricing` still works.

Both pages share existing styling, header, footer, dialogs and progressive
enhancement. Each has one main heading, a canonical URL and sitemap entry.
The pricing page's heading outline was adjusted for a standalone document.
`/pricing` redirects to `/pricing/`; no framework, dependency or runtime routing
was introduced. All authoritative content, source, image, specimen and market
records are unchanged. `src/pricing.html` is the new canonical narrative file;
`pricing/index.html` is generated and staged in `dist/pricing/index.html`.

The build and **2,102 local checks passed**: 1,697 structural/rendering,
91 research consistency, 28 editorial, 213 existing Chromium checks and 73
two-page pricing checks. **73 pricing checks also passed on the public domain**,
including byte comparisons for both pages, downloads, mobile layouts, source
dialogs, old bookmarks, cross-page navigation, no-JavaScript reading and print.
See `research/market-browser-qa.json` and `research/market-hosted-qa.json`.
The authenticated preview and desktop/mobile page layouts were visually reviewed.
An additional **209 public release checks passed**; see
`research/pricing-page-release-qa.json`. All 17 real page photographs and 17
original viewer images loaded, with their recorded dimensions, credits, six reuse
notices, keyboard zoom and focus return preserved. HTTPS redirects, private-file
404s, existing geography/anatomy/comparison controls and direct links also passed.
Together with the pricing suite, that is **282 hosted checks**. These are Chromium
checks, not cross-browser or accessibility certification. No new publication
decision remains; the earlier image-reuse decision and pricing caveats still apply.

The previous release notes below describe the earlier single-page implementation.

## Pricing chapter — 17 September 2026

The owner requested incorporation of the pricing research into the scrolling site.
Chapter 09, “Once money. Now collected,” follows the evidence chapter and links
back to the reference atlas. It adds current condition-group comparisons, a
responsive 2019–2026 chart, a catalogue-linked repeat sale, a full-crest example,
a buyer-premium calculator, and a filterable ledger with CSV/JSON downloads.
Six family cards include collapsed price notes for other specimens. Museum
photographs are not assigned valuations. No auction photographs were added.

The snapshot contains **64 auction results and two public eBay observations**.
All 32 earlier source records remain unchanged; eight market references bring
the bibliography to 40. All 17 image records, three BnF specimens and six reuse
flags are unchanged. Historical observations are selected small samples, not a
price index; eBay displayed amounts remain explicitly unverified and excluded
from auction statistics. Actual accepted-offer data remains unavailable.

`npm run build:deploy` staged `dist/` and the personal Vercel project published
that directory. The authenticated HTTPS preview was visually checked before
production. **1,862 local checks passed:** 1,489 structural/rendering, 91 research
consistency, 28 editorial, 213 existing Chromium smoke checks and 41 market checks.
The new market suite was rerun after the responsive chart refinement.

On the public domain, **48 pricing checks and 209 release checks passed**:
`research/market-hosted-qa.json` and `research/market-release-qa.json`. Hosted HTML
matches `dist/index.html`; both downloads contain all 66 observations. Pricing
was tested from 320 to 1,440 px, with keyboard input, invalid and zero fee values,
combined filters, empty results, direct sale links, print output and no JavaScript.
All 17 real page photographs and all 17 original viewer images loaded from their
recorded URLs; original dimensions, credits, rights notices, zoom and focus return
were checked. Real hosted photographs and desktop/mobile pricing layouts were
visually inspected. Coverage is Chromium, not accessibility certification or a
Safari/Firefox audit. No new publication decision is pending for this update.

The original research notebook in `research/market-pricing-2026-09-17/` retains its
research-only validation scope. Public records now live in `src/content.json`;
the generated `research/market-sales.*` exports are staged as `dist/data/owl-sales.*`.
The research report and internal QA reports are not part of the deployed directory.

## Domain connection

Squarespace remains the registrar and DNS provider. The Squarespace Defaults
parking preset (four A records, the `www` CNAME and the apex HTTPS record) was
replaced with Vercel's project-specific recommended records:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | @ | 216.150.1.1 | 30 minutes |
| A | @ | 216.150.16.1 | 30 minutes |
| CNAME | www | 57cb3053370ee0b2.vercel-dns-017.com | 30 minutes |

The `_domainconnect` CNAME and all three Email Security TXT records were
preserved. Nameservers, DNSSEC, registration and billing settings were unchanged.
Vercel handles the `www` → apex 308 redirect and HTTPS certificates.
The DNS change history is recorded in `research/domain-launch-dns.json`.

## Public launch validation

On 17 September 2026, `npm run build:deploy` succeeded and staged only `dist/`.
All **1,352 local checks** passed: 1,020 structural/rendering, 91 data consistency,
28 editorial and 213 Chromium browser checks. The browser suite deliberately
blocks remote images; it was followed by independent tests on the public domain.

All **207 anonymous HTTPS checks** passed on `theowlatlas.com`; see
`research/domain-launch-qa.json`. Production HTML and the five public supporting
files exactly matched `dist/`. HTTPS, the permanent `www` redirect, section links,
production indexing, private-file 404s and protected preview URLs were verified.
All **17 real page photographs and 17 original viewer images** loaded with the
recorded dimensions. Credits and six review notices remained visible; keyboard
zoom, pan, Escape and focus return worked with real images.

The live page was checked at 1,440, 768, 390 and 320 px, with reduced motion and
without JavaScript. Geography, both close-reading faces, Pi comparison presets,
source dialogs and bibliography search worked. No uncaught JavaScript errors
were observed. Photographs and layouts were also visually inspected on the
hosted site. This is Chromium coverage, not cross-browser or accessibility
certification.

The reports below preserve earlier preview checks and their original scope.

## Account history

**Account correction:** the initial deployment mistakenly selected a similarly
named Hobby workspace belonging to the work-associated login. On 16 September
2026, the existing project and deployments were transferred to the verified
personal account. The API confirmed the new owner and removal from the previous
workspace. The existing preview was opened successfully in the user's already
signed-in personal browser session. Later previews were deployed directly under the personal workspace.
All addresses remained protected during preview work. The stable production
address retained the initial build until the public launch on 17 September,
when the latest validated edition was deployed.

## Deployment configuration

`vercel.json` uses the original `npm run build:deploy` command, skips dependency
installation, and publishes only `dist/`. No framework, runtime service, paid
resource, domain purchase, tracking or analytics was added by the agent. Public
production now has canonical/social metadata, a favicon, robots.txt and a sitemap.
The unconditional preview-only `noindex` header was removed for public release.
Git-triggered deployments remain off; releases are made deliberately with the CLI.

The source was successfully pushed to `emptypockets-dev/owl-atlas` on `main`.
After the account transfer, Vercel successfully connected that GitHub repository;
the earlier access error is resolved. Automatic Git deployments remain disabled
by `vercel.json`; publishing remains a manual step.

For future CLI operations, use the project-local personal-account login and an
explicit scope, without changing the machine's default work-account login:

```sh
vercel whoami --global-config .vercel/personal-cli
vercel deploy --target preview --scope emptypocketsdevs-projects --global-config .vercel/personal-cli
# Publish a validated release:
vercel deploy --prod --scope emptypocketsdevs-projects --global-config .vercel/personal-cli
```

The expected username is `emptypockets-dev`. Verify the account identity before
any mutation. If that local login is missing on another machine, sign in to the
personal account first. `.vercel/` and `.env.local` contain local configuration
and credentials and must remain excluded from Git.

The source repository is public by the owner's request. It contains source,
research records and existing QA material; the hosted site exposes only the
built HTML, favicon, robots.txt, sitemap.xml, `LICENSE.txt` and
`THIRD_PARTY_NOTICES.txt`. Requests for source, research files and `.env.local`
return 404 on the public domain. Local Vercel
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
- Edited the full reading path to reduce repeated geography, visual descriptions
  and general cautions. Earlier coinage now precedes the first owl photographs;
  the 404 BCE chapter links onward to chapter 05; the regional chapter explicitly
  returns to parallel fourth-century traditions; and the story ends with a link
  into the reference atlas. Specific dating, attribution and rights qualifications
  remain with their evidence. See `research/story-flow-review.md`.
- Chapter 02 now shows obverse and reverse together for both early examples.
  The archaic views use the existing paired plate; the early-classical pair uses
  Cleveland 1920.267.a/b. Credits, declared crops and original-image viewer links
  are retained. The heading is now “The owl, in its early forms.” The previous
  “experiment” wording implied a purpose not established by the cited evidence.
  Its introductory period label now includes the mid-fifth century, consistent
  with the displayed 480–449 BCE catalogue range. No specimen dates changed.
- Separated photograph clipping from the image controls. The two circular
  New Style displays now keep their “Look closer” labels and keyboard focus
  outlines visible. Centered labels clear the portrait inset at narrow widths;
  the photographs retain their circular crop and hover enlargement. The hero
  label remains hidden as requested.

- Cleared all eight map connectors from names and subtitles, lifted the Athens
  label and Mediterranean Sea label clear of markers, and added a narrow halo
  around lettering to prevent coastlines from obscuring it. A readable scale note
  explains the thousands of kilometres covered, enlarged markers and offset names.
  Geographic coordinates, coastline geometry, historical qualifications, mobile
  key and Natural Earth attribution remain intact.

- Replaced the slash-separated geographic heading with a complete explanation:
  Athens is a city in Attica, a region of present-day Greece. Marker 1 and the
  numbered key explicitly identify the city; a nearby note explains that the
  region and country boundaries are not drawn. The accessible SVG description
  carries the same relationship. Adjacent prose now focuses on Athens as an
  ancient city-state, avoiding a repeated geographic explanation.

- Replaced the single pin map with a guided eight-place geography explorer.
  Focused SVG area maps, contextual locators, approximate scale bars and modern
  outlines show cities, islands, countries and historical regions differently.
  Athens is located within Attica and Greece; Egypt includes the Nile and delta;
  Iran and Afghanistan have separate outlines. Hatching identifies broad regional
  locators, with visible limitations. Each entry explains its relationship to owl
  coinage and links to the relevant evidence. Native controls support keyboard and
  mobile selection; all entries remain readable without JavaScript and in print.
  See `research/geography-explorer-findings.json` for data provenance.

- Added an explicit owl/reverse and Athena/obverse toggle to the close reading.
  Each face has its own detail controls, photograph and remembered selection.
  All six existing sourced readings remain; both faces and all explanations are
  available without JavaScript and in print. The eye marker now points to the
  visible eye on Cleveland 1941.296.a. Credits and original-image links are intact.

- Added a three-step minting illustration after the silver-mining story.
  Original SVG side views explain engraved dies, the flan and the hammer strike,
  with visible labels, accessible descriptions and responsive layouts. All steps
  remain available without JavaScript. A new Met source supports the explanation;
  an onward link leads into the early photographs. The flan definition now occurs
  once at its first use. See `research/minting-findings.json`.

The broader editorial design and existing photograph interactions are preserved.
`src/app.js` now also enhances the pre-rendered geography views; the page, styles
and renderer include the requested family-tree, geographic and story-flow updates. The original 28 sources, 16 image records, three BnF
specimens, six reuse-review flags, dates, attributions and existing image URLs
remain. The documented early-classical reverse brings the image total to 17.
The geographic references brought the source total to 31; the minting reference
brings the current total to 32.
`MANIFEST.sha256` and `research/handoff-validation.json` describe the original
handoff package, not this later deployment.

## Verification

- `npm run build:deploy`: passed locally and on Vercel; output is `dist/`.
- `npm run check`: 1020 checks passed (the total changes with rendered citations).
- `python3 tests/integration_data.py`: 91 checks passed.
- `python3 tests/editorial_copy.py`: 28 checks passed.
- Chromium smoke suite: see `research/browser-qa.json` (213 checks; image requests
  intentionally blocked). Playwright was run from an isolated temporary tooling
  environment, with no dependency added to this project.
- Current minting HTTPS preview: see `research/minting-qa.json`. All 105 checks
  passed across 320, 390, 768, 1024 and 1440 pixels. Hosted HTML exactly matches
  `dist/index.html`; SVG labels fit without overlapping one another. The source
  dialog opens by keyboard, links the relevant PDF page and restores focus.
  The minting deep link survives reload; the onward link reaches the early coins.
  All three steps remain visible without JavaScript and in print. No horizontal
  overflow or page JavaScript errors occurred. Desktop and mobile diagrams were
  visually inspected, along with actual hero, early-classical reverse and
  classical Athena photographs. These photographs and their original viewer
  sources loaded successfully. Existing preview indexing restrictions remain.
- Previous close-reading HTTPS preview: see `research/anatomy-faces-qa.json`.
  All 245 checks passed across 320, 390, 768, 1024 and 1440 pixels. Both actual
  Cleveland photographs loaded, including the exact recorded viewer dimensions
  and URLs. Keyboard face switching, remembered detail selection, markers,
  citations, zoom, Escape and focus return passed. Both faces and all readings
  remain available without JavaScript and in print, and no horizontal overflow
  or page JavaScript errors occurred. Hosted HTML exactly matches `dist/index.html`
  and retains the preview indexing restriction. Desktop and mobile photographs
  and detail-marker positions were visually inspected on the hosted preview.
- Previous guided-geography HTTPS preview: see `research/geography-explorer-qa.json`.
  All 463 checks passed across 320, 390, 768, 1024 and 1440 pixels. Every place
  supports keyboard or native mobile selection, with one exposed panel and
  synchronized selection state. All SVG labels fit, area outlines, shading legends,
  scale bars and context locators are present, source dialogs restore focus, and
  next-place navigation moves focus to the new heading. Direct Egypt links survive
  reload; all eight views appear without JavaScript and in print. Hosted HTML
  matches `dist/index.html` exactly, preview indexing remains restricted, and no
  page JavaScript errors occurred. Real hero, early-classical reverse and BnF Pi III
  reverse photographs loaded and were visually inspected. All eight desktop views
  and the mobile layouts were inspected. Geographic interpretation, provenance and
  remaining limits are documented separately from these automated checks.
- Previous geographic-hierarchy HTTPS preview: see `research/map-hierarchy-qa.json`.
  All 73 checks passed, covering the explicit city/region/country explanation,
  Athens marker and mobile key, absence-of-boundaries note, accessible description,
  no-JavaScript text, map connector and marker clearance, and viewport fit at
  320, 390, 768, 1024 and 1440 pixels. Hosted HTML exactly matches `dist/index.html`,
  the origins deep link and preview noindex header are preserved, and no page
  JavaScript errors occurred. The hosted desktop and mobile views and three real
  photographs (hero, early-classical reverse and BnF Pi III reverse) were visually
  inspected. Existing source, specimen and image records remain unchanged.
- Previous map-label HTTPS preview: see `research/map-label-qa.json`. All 56 checks
  passed: hosted HTML exactly matches `dist/index.html`, the origins deep link and
  indexing restriction are preserved, connector paths clear all label bounds,
  markers clear text, labels fit the map, lettering has a coastline halo, and
  the scale note and eight-place key remain readable at 320, 390, 768, 1024 and
  1440 pixels. No horizontal overflow or page JavaScript errors occurred. The
  explanation and place key remain available without JavaScript. Real hero,
  early-classical reverse and BnF Pi III reverse photographs loaded and were
  visually inspected, along with desktop and mobile map screenshots. Source
  comparison confirmed unchanged coastline geometry and geographic marker positions.
- Previous circular-label HTTPS preview: see `research/circular-label-qa.json`.
  All 87 checks passed, including unobstructed label corners and centers during
  hover and keyboard focus at 320, 390, 768, 1024 and 1440 pixels, circular photo
  clipping, visible focus outlines, original-image loading in the viewer,
  Enter/Escape and focus return, no horizontal overflow, no-JavaScript links,
  preservation of paired-plate crop frames and the hidden hero label. Hosted HTML
  exactly matches `dist/index.html`; no page JavaScript errors occurred. Desktop
  and mobile photographs and labels were visually inspected.
- Previous early-face HTTPS preview: see `research/early-faces-qa.json`. All 70 checks
  passed: exact hosted HTML equality with `dist/index.html`, preserved deep link,
  heading, face labels and crops, side-by-side photographs at 320, 390, 768, 1024
  and 1440 pixels, real page-image delivery, all four viewer links with verified
  original dimensions and source URLs, Enter/Escape and focus return, and
  no-JavaScript access. Desktop and mobile views were visually inspected; no page
  JavaScript errors occurred.
- Previous story-flow HTTPS preview: see `research/story-flow-qa.json`. All 93 checks
  passed: exact hosted HTML equality with `dist/index.html`, preview indexing
  restriction, all eight chapter deep links, both onward story links, viewport
  fit at 320, 390, 768, 1024 and 1440 pixels, citation dialogs and focus return,
  and no-JavaScript reading. All 17 real remote photograph records loaded on the
  page. Updated desktop and mobile chapter screenshots were visually inspected;
  no page JavaScript errors occurred. Narrative flow was assessed through reading,
  not inferred from the automated test results.
- Previous geography HTTPS preview: see `research/geography-qa.json`. All 43 checks
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

## Publication decision and remaining limitations

The owner selected the purchased `theowlatlas.com` domain and approved public
publication with all six BnF/Gallica images retaining their current review
notices. This resolves the owner decisions that had kept the preview restricted.
It does not resolve the underlying BnF reuse conditions or obtain permission.
All original attribution, source links and qualifications remain visible.

Photographs remain remote. No photographs were vendored or optimized. Archiving
approved photographs and using permitted, documented smaller page derivatives
remain future reliability/performance options, preserving originals and rights
records. The earlier 8.6 MB initial image-transfer measurement is a mobile-loading
limitation, not a new measurement of the domain launch.

Specialist numismatic review, the documented coverage gaps, Safari/Firefox,
screen-reader review and real-device touch testing remain outstanding. The checks
are not accessibility certification, rights clearance, authentication advice or a
new independent audit of all historical sources. Existing low-resolution plates
remain honestly identified; no image was fabricated, enhanced or substituted.
