# The Owl Atlas

**A small owl. An ancient world.**

**Current launch status:** public at **https://theowlatlas.com/** on the owner's
personal Vercel account. See [LAUNCH_STATUS.md](LAUNCH_STATUS.md) for DNS details,
live-image checks, the recorded publication decision and remaining limitations. The handoff descriptions
below describe the original package; its reports are preserved as historical records.

**Launch handoff:** start with `START_HERE.md` and `AGENTS.md`. The prepared
`dist/` folder contains only publishable site files; see `LAUNCH_CHECKLIST.md`
for remaining release checks. Nothing has been deployed by creating this package.

A working, museum-inspired scrollytelling website about Athena/owl coinage.
Research edition 03, editorially revised 16 September 2026. It is an independent editorial
foundation, not yet a complete or specialist-reviewed numismatic corpus.

## Open it

Open `index.html` in a modern browser. No installation, build, API key or account
is required. The HTML contains its CSS, JavaScript and content data.

**An internet connection is required for the photographs.** The distributed
edition references the museum and Wikimedia image hosts; it does not bundle
image bytes. The story and references remain available when images fail.

**Headlines fall back to Georgia when you open `index.html` straight off the
disk.** The display face, Fraunces, is self-hosted under `public/fonts/`, and the
stylesheet asks for it at a root-absolute path (`/public/fonts/fraunces/…`)
because the same CSS is inlined into pages at two directory depths. Over
`file://` a root-absolute path resolves to the root of the filesystem, so the
font never loads and the metric-matched Georgia stand-in is used instead. The
page is complete and correct either way — the shapes are simply Georgia's. Serve
the folder over HTTP, as below, to see the intended typography.

For local development, serve the folder with any static server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Audience and editorial framing

The atlas is for anyone interested in ancient coins, art, archaeology and history.
It does not assume coin ownership, a recent purchase, a grading label or numismatic
expertise. Museum specimens illustrate the broader story rather than stand in for
a visitor’s object. Keep personal correspondence and commissioning context out of
narrative copy, comparison cards, image notes and source dialogs.

The reading path follows the coins, their changing designs, issuing communities
and historical context. Practical catalogue terminology remains available in an
optional, keyboard-accessible reference disclosure beside the glossary. Dating
uncertainty, provenance and image rights remain attached to the relevant evidence.
The subsequent story-flow edit removes repeated explanations and clarifies
chronological transitions; see `research/story-flow-review.md` for its scope.

Edition 03 is an editorial revision, not a new source audit. All 16 image URLs,
attributions, rights caveats, 28 source records and three BnF specimens are retained.
The subsequent launch update adds a seventeenth image: Cleveland 1920.267.b,
the CC0 reverse of the existing early-classical obverse. Museum records confirm
both belong to the same coin; see `research/early-classical-findings.json`.

## The experience

- Seven narrative chapters, in this order: 01 Silver from Laurion — Attica, the Laurion
  mining district, a photograph of Laurion ore with the path from ore to lead to silver,
  and the minting illustration; 02 The
  classical icon — the interactive close reading, on a dark ground; 03 War and its
  aftermath (404 BCE); 04 The redesign (New Style); 05 An owl beyond Attica — the Sabakes
  example and the eight-region geographic explorer; 06 How we know — four kinds of evidence
  and Nikophon's law of 375/4 BCE; 07 The owl today. A compact continue row follows
  chapter 07 with two links, the reference atlas and its sources and image credits,
  and the One Owl invitation ends the page. Every chapter closes with a one-line link
  to the next section; a hairline marks where chapter 02's dark ground meets 03.
  The home page was reordered on 21 September 2026 so the reader meets the coin before the
  maps; the explorer moved from chapter 01 to chapter 05 whole, with every deep link intact.
  Two chapters were removed earlier the same day at the owner's request: the
  fourth-and-third-century chapter, and "The owl takes shape". What they
  argued is now in the chapter 02 close reading, that chapter's opening deck, the `/atlas/` family
  cards and the glossary; the archaic and early classical photographs stay on `/atlas/`.
- A short pricing chapter introduces three examples spanning the 2026 auction sample.
  The full research lives at `/pricing/`: 64 auction results, two qualified public eBay
  observations, a 2019–2026 chart, repeat-sale comparison, fee calculator and searchable ledger.
  Ordinary links connect both pages; old main-page sale and pricing-topic bookmarks
  follow the moved chapter with JavaScript, or land beside its link without JavaScript.
  Six family cards offer collapsed pricing notes for other specimens. Museum objects are not valued.
  `src/content.json` holds the authoritative market records; the build exports CSV/JSON to
  `research/market-sales.*` and stages public downloads in `dist/data/owl-sales.*`.
- A three-step minting illustration connects the silver-mining story to the
  early coins: engraved dies, the silver blank, and the hammer strike. Original
  SVG side views and accompanying text remain readable without JavaScript.
- Scroll reveals, restrained parallax, a chapter indicator and reading progress.
  Scrolling is never hijacked. OS reduced-motion preferences take priority.
- An interactive close reading in chapter 02: six sourced details across both
  sides of Cleveland 1941.296. A native radio pair chooses the face, detail
  buttons choose a reading, and a numbered marker moves to that reading's own
  coordinates over the photograph. Every reading, both photographs and all their
  citations are rendered at build time, so without JavaScript the whole close
  reading is simply on the page with the controls hidden; the same is true in
  print. The readings are in `src/content.json` under `closeReading`.
  The “Anatomy of an Owl” exhibit that briefly replaced this reading was removed
  on 21 September 2026; its archive is in `research/previous-close-reading/`, and
  the artifact camera module remains in `src/` but is no longer built in.
- A dedicated `/atlas/` reference page contains the comparison tool, eight-family atlas, glossary, bibliography and image-use records. The homepage ends with a short invitation to explore it. Old reference bookmarks redirect to the new page.
  The "Which owl does this resemble?" identifier that stood above the comparison tool,
  and the `/kit/` creator kit page, were removed on 23 September 2026 at the owner's
  request. The kit's template is archived, unbuilt, in `research/kit-page-archived/`;
  the sources it cited stay in the bibliography.
- A two-column, eight-family comparison atlas. Pi-style additionally has separate
  Pi II/Pi III specimen selectors, and story links preset meaningful comparisons.
- A native-dialog image viewer with source/rights metadata, fitted-size zoom,
  keyboard controls, drag and pinch handlers, and original-image links.
- Inline source dialogs, 51 bibliography records, author/topic filtering, 18
  image records, three structured BnF specimen records, a glossary and a visible
  editorial coverage register.
- A guided geographic explorer, in chapter 05, distinguishes cities, islands, modern
  countries and historical regions. Eight focused area maps have wider locators, scale bars,
  source-linked coin evidence, keyboard controls and a mobile selector. Athens is
  shown within Attica and Greece; other regions are areas rather than numbered pins.
  All eight entries remain readable without JavaScript and in print. See
  `research/geography-explorer-findings.json` for data and qualifications.
  Chapter 01 draws no map: since 23 September 2026 a photograph of Laurion ore
  (`laurion-galena`: galena on display at the Carnegie Museum of Natural History,
  photographed by James St. John, CC BY 2.0 via Flickr) stands where its static
  Athens & Attica figure was.

## Edit and build

Node 20 or newer is sufficient. There are no npm dependencies to install.

```sh
npm run build          # rebuild index.html from source files
npm run check          # check references, IDs, rendering and JavaScript syntax
npm run social         # re-render the four 1200×630 share cards (network + renderer)
```

| File | Responsibility |
| --- | --- |
| `src/page.html` | Narrative, semantic document structure and build tokens |
| `src/content.json` | Authoritative sources, image records, families, glossary and geographic explanations |
| `src/geography.json` | Derived public-domain geographic outlines used at build time |
| `src/styles.css` | Design tokens, responsive layouts, motion and print styles |
| `src/app.js` | Progressive enhancements and native dialog behavior |
| `src/artifact-explorer.js` | Reusable artifact camera, discrete scroll states and coordinate authoring helper |
| `src/render.mjs` | Shared escaped markup used by build and browser |
| `src/atlas.html` | Dedicated comparison atlas, glossary, bibliography and image-use records |
| `atlas/index.html` | Generated reference page; do not hand-edit |
| `src/pricing.html` | Full pricing research page; shares the main page's header, footer and dialogs |
| `pricing/index.html` | Generated pricing page; do not hand-edit |
| `build.mjs` | Inlines the page assets and exports research manifests |
| `scripts/derive-images.mjs` | Downloads originals and writes the resized display copies |
| `public/images/derived/` | Generated display copies and their manifest; do not hand-edit |
| `research/sources.json` | Generated bibliography export; do not edit directly |
| `research/images-manifest.json` | Generated image/rights export; do not edit directly |
| `research/specimens.json` | Generated museum-object export with separate catalogue dates |
| `research/pi-later-old-findings.json` | Original research input, retained without rewriting its historical status |

The architecture is deliberately framework-free: the story is pre-rendered, and
interactivity enhances it rather than delivering it. This keeps the output
portable, readable without JavaScript, and usable without a package installation.
The structured content can be reused in a React/Next.js implementation; native
`dialog`, `details` and form controls need not be replaced with custom widgets.

The editorial chronology and object metadata are different layers. A photographed
coin retains its museum's own date even when that label is broader, older, or
different from the atlas's overall chronology. Do not silently overwrite either.

## Archive photographs for self-hosting

A durable public resource should not depend indefinitely on hotlinked images.
The optional script downloads only the source-linked image URLs in the manifest;
it retains attribution and license metadata and records SHA-256 checksums.
It does not scrape auction websites, discover substitutes, upscale photographs
or change anyone's reuse rights.

```sh
npm run vendor:images   # network required; skips six reuse-review-pending additions
npm run build:local    # refuses to build unless every image has a local record
npm run check
```

The local build expects `public/images/local-manifest.json` and the referenced
files. Publish **both** `index.html` and `public/images/`, preserving their paths.
Use `node scripts/vendor-images.mjs --force` to intentionally refresh approved
files. `OWL_IMAGE_USER_AGENT` may be set to your deployment's identifying agent.

Six BnF photographs are marked `review-pending`. The default vendoring command
will not download those files and will exit with an incomplete-build message.
Resolve the intended publication rights before treating this as a cleared image
collection. A deliberate local **research** download may use:

```sh
node scripts/vendor-images.mjs --include-review-pending
```

That switch records the original unresolved reuse status in the local manifest;
it is not permission to publish, and it does not change any rights assertion.

External downloads could not be completed in the creation environment. The
vendoring script is included but has not been integration-tested against the
remote hosts. Source images were inspected during the preceding research; browser tests
of this build did not validate actual remote-image delivery. Confirm all images,
rights records, and crop choices in an internet-connected browser before launch.

### Self-hosted display copies

Page loading no longer depends on multi-megabyte museum originals. A separate
script downloads each eligible original into a git-ignored `.cache/originals/`
and writes resized JPEG display copies into `public/images/derived/`, committed
alongside the source. It uses macOS `sips`; there are still no npm dependencies.

```sh
npm run derive:images   # network required on the first run; then offline and idempotent
npm run build           # merges public/images/derived/manifest.json, no network needed
npm run check
```

- Widths are 800 and 1,600 pixels, at JPEG quality 82, plus a 2,400 copy of the
  classical owl that the withdrawn Anatomy exhibit used and nothing now requests.
  A requested width larger than the source is skipped: nothing is ever enlarged,
  and a source narrower than 800 pixels is re-encoded only at its own size.
- A copy that would not be smaller than its original is discarded, so
  `profile` and `sabakes` keep their existing display URLs.
- File names carry a content hash, so `vercel.json` serves
  `/public/images/derived/` as immutable for a year. `npm run build:deploy`
  stages only the derived files the build actually references.
- `image.url` is untouched. It remains the "Full-resolution original" link and
  the image viewer's on-demand source, including from the close reading. Each
  derived record's `changes` note states the transformation, which is also
  visible in the viewer and the image register.
- The six reuse-review-pending BnF photographs are never downloaded or derived
  here and continue to hotlink their originals unchanged.
- `public/images/derived/manifest.json` records, per photograph, the SHA-256 of
  the original it was resized from, the tool and settings used, and the bytes
  and pixel size of every derivative. `npm run check` verifies those bytes on
  disk. `node scripts/derive-images.mjs --force` re-downloads and rebuilds.

The hero photograph carries a 24-pixel blurred placeholder, inlined as a data
URI under 1.1 KB, so the hero disc is never an empty well while the photograph
arrives. Placeholders are loading affordances generated from the same source
file; they are never presented as the photograph, and the viewer still opens
the original.

Unlike the vendoring script above, `scripts/derive-images.mjs` has been run
against the live hosts: 11 originals (19.2 MiB) downloaded and verified, and
14 display copies (6.3 MiB) written.

## Accuracy and publishing status

The website shows research uncertainty instead of concealing it in a seamless
animation. Sources distinguish catalog conventions from research conclusions,
and the source dialogs state what each record supports.

Edition 02 adds the BnF's **Pi III, 1966.453.1475** (2,522 × 2,522 pixels
per side), **quadridigité, 1966.453.1478** (2,679 × 2,679), and **Pi II,
1966.453.1469** (2,624 × 2,624). The chapter exhibits, comparison atlas,
family cards, viewer, bibliography, and image register share these records.
Museum catalogue dates remain distinct from the editorial chronology.

All six new photographs link directly to the full-size Commons files and retain
the BnF / Gallica credit. Commons asserts PD-France status, while BnF separately
publishes commercial/promotional reuse conditions. The images remain visibly
**Reuse review pending**; they are not mislabeled CC0 or publication-cleared.

The Heterogeneous Group C CNG auction record is included as a sourced lead, not
as a substitute photograph. Its 500 × 240-pixel preview is not embedded.
Other coverage gaps are recorded on the site: smaller denominations, emergency
gold and plated issues, bronze, broader regional owl traditions, New Style
magistrates, die sequences and modern forgeries. Some cited chronology papers
are bibliography-only references, explicitly labeled as such.

Before presenting this as *the definitive resource*, complete those gaps and
obtain a specialist numismatic review of the chronological and attribution
claims. Avoid using it as authentication, valuation, or purchase advice.

## Accessibility, privacy and tests

Semantic landmarks, a skip link, visible focus treatment, native dialogs,
keyboard zoom/pan, labeled controls and reduced-motion support are implemented.
Most story content, source links and family entries work without JavaScript.
The comparison controls themselves require JavaScript.

The reading scale uses rem-based type: ordinary narrative is 16–17px at the
default browser setting, with 13–15px supporting text. Captions, source notes,
charts and controls have their own hierarchy. Navigation wraps on smaller
screens, measures its height for deep links, and keeps all four destinations
available. Narrow comparison panels stack while family cards retain paired
coin faces. Text enlargement and increased spacing are checked separately.

The site adds no analytics, accounts, trackers, cookies or third-party fonts: the
two open-licensed display faces are served from this site's own origin, so no
font CDN learns anything about a reader. Its only
stored preference is the optional motion setting in browser local storage.
Remote image hosts still receive ordinary browser requests.

Run the non-browser research-integrity and public-copy regression checks with:

```sh
python3 tests/integration_data.py
python3 tests/editorial_copy.py
```

`research/editorial-qa.json` records the public-copy assertions, and
`research/integration-qa.json` records the BnF manifest consistency checks.
`research/browser-qa.json` records the browser smoke test results and limitations.
`tests/browser_smoke.py` is optional and requires Python Playwright plus Chromium:

```sh
# Use your own installed Chromium executable:
CHROMIUM_PATH=/path/to/chromium python3 tests/reference_browser.py
CHROMIUM_PATH=/path/to/chromium python3 tests/market_browser.py
CHROMIUM_PATH=/path/to/chromium python3 tests/readability_browser.py
# Optional deployed-build comparison and public-download verification:
MARKET_URL=https://theowlatlas.com CHROMIUM_PATH=/path/to/chromium python3 tests/market_browser.py
```

Tests cover five viewport widths, reduced motion, native modal opening/closing
and focus return, image-error states, the chapter 02 close reading, both sides of all eight comparison
entries, Pi II/Pi III selection and comparison presets, BnF object and reuse
metadata, source filtering, the optional catalogue guide and JavaScript-disabled reading. A clearly labeled
synthetic grid tests loaded-image zoom/pan; it is never included in the website.
Remote requests are deliberately blocked during that test. These are smoke
tests, not an accessibility certification or a full visual-regression suite.
Safari/Firefox, real touch gestures, screen readers and genuine online imagery
still need an in-context review.

The readability suite checks both pages at 320–1440 CSS pixels, sampled text
sizes, header targets, keyboard source dialogs, 200% root-font enlargement,
increased text spacing and no-JavaScript reading. Its JSON output does not
overwrite other reports. Root-font enlargement is not actual browser zoom.
See `research/readability-qa.json` for the latest run and
`research/readability-release-qa.json` for separate public-site/photo checks.

## Share cards and structured data

Each page declares its own 1200×630 `og:image` and a `summary_large_image`
Twitter card, plus one `application/ld+json` block that `build.mjs` derives from
the page's own head and from `src/content.json`, so the card, the JSON-LD and the
visible metadata cannot drift apart. The home and atlas pages also carry an
`ImageObject` for each rights-cleared photograph they show, with `contentUrl`,
`license`, `acquireLicensePage`, `creditText`, `creator` and `copyrightNotice`.
**The six BnF records whose reuse review is unresolved are excluded from
structured data and from the cards entirely.** `public/sitemap.xml` is generated
with the reviewed `lastmod` and an image entry per card.

The committed PNGs under `public/social/` are produced by
`scripts/render-social.mjs` (`npm run social`). It downloads the museum
originals into the gitignored `.cache/originals/`, composites one shared SVG
template per page, and rasterises it with Playwright's cached Chromium headless
shell, falling back to `rsvg-convert`. Alt text lives in `src/content.json` under
`social`; `npm run check` fails if a page's alt text, image URL, JSON-LD or PNG
size drifts. Re-run it — and commit the result — whenever the display font, the
market snapshot or a card headline changes.

## Deployment

Build the public-only folder with `npm run build:deploy` and set your static
host's output directory to `dist`. For an approved complete local-image set, use
`npm run build:deploy:local` instead. `scripts/prepare-deploy.mjs` stages only the
built HTML, code license, third-party notices, the four share cards under
`social/` and explicitly referenced local images; it does not deploy anything.
Preview with:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

The output is static. Publish all of `dist/`, including `pricing/index.html` and
the `data/` downloads, to an HTTPS static host. With local
photography, also upload `public/images/`. No server code is needed. Do not deploy
research notebooks or test files unless intentionally making the source public.
The public site is hosted at https://theowlatlas.com/ on the owner's personal
Vercel account. Preview deployments retain Vercel login protection.

## Rights

Original implementation code is provided under MIT; see `LICENSE`.
**Photographs and source publications are not relicensed under MIT.** Retain the
creator, institution, original-record link, license and modification notes
attached to each image. Review `THIRD_PARTY_NOTICES.md` and the image manifest
before redistribution. No museum, researcher or photographer endorsement is
claimed or implied.

## One owl: owner-requested companion story

`/one-owl/` follows the survival of NGC 2086328-049. Its personal specimen
framing is an intentional, owner-requested exception confined to this page.
The main narrative, its 41 sources, 17 external images and six BnF review flags
remain unchanged apart from a short link to the companion.

Edit `src/one-owl.html` for the story, `src/one-owl.json` for its scoped specimen,
source and photograph records, and the scoped journey rules in `src/styles.css`
for presentation. `build.mjs` generates `one-owl/index.html` and the research
manifest; do not hand-edit them. `npm run build:deploy` includes the page and all
four original JPEGs in `dist/`. The existing optional vendor command continues
to concern the main atlas's external photographs only.

`python3 tests/one_owl_data.py` checks specimen data and photo integrity.
`tests/one_owl_browser.py` uses optional Playwright/Chromium to test the real
photographs, keyboard dialogs, responsive layouts and no-JavaScript story.
It serves `dist/` on a temporary local server by default; set `BASE_URL` for the
hosted origin and `CHROMIUM_PATH` for a locally installed Chromium executable.

The companion includes an owner-requested historical-fiction interlude, “The gift
that waited.” Its invented events are visibly bounded and separately recorded in
`src/one-owl.json`; sourced collecting and preservation history follows the story.
The fiction does not extend the specimen’s documented provenance. See
`research/coin-survival-fiction-notes.md` for the editorial basis.
