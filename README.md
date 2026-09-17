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

- Nine narrative chapters: Athens and the geography of owl coinage; early owls; classical mass issues;
  404 BCE; fourth-century changes; New Style; regional imitations; evidence; and collecting today.
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
- A six-part coin-detail reader with an explicit owl/reverse and Athena/obverse
  toggle. Each face remembers its selected detail; both faces and every sourced
  reading remain available without JavaScript and in print.
- A two-column, eight-family comparison atlas. Pi-style additionally has separate
  Pi II/Pi III specimen selectors, and story links preset meaningful comparisons.
- A native-dialog image viewer with source/rights metadata, fitted-size zoom,
  keyboard controls, drag and pinch handlers, and original-image links.
- Inline source dialogs, 41 bibliography records, author/topic filtering, 17
  image records, three structured BnF specimen records, a glossary and a visible
  editorial coverage register.
- A guided geographic explorer distinguishes cities, islands, modern countries
  and historical regions. Eight focused area maps have wider locators, scale bars,
  source-linked coin evidence, keyboard controls and a mobile selector. Athens is
  shown within Attica and Greece; other regions are areas rather than numbered pins.
  All eight entries remain readable without JavaScript and in print. See
  `research/geography-explorer-findings.json` for data and qualifications.

## Edit and build

Node 20 or newer is sufficient. There are no npm dependencies to install.

```sh
npm run build          # rebuild index.html from source files
npm run check          # check references, IDs, rendering and JavaScript syntax
```

| File | Responsibility |
| --- | --- |
| `src/page.html` | Narrative, semantic document structure and build tokens |
| `src/content.json` | Authoritative sources, image records, families, glossary and geographic explanations |
| `src/geography.json` | Derived public-domain geographic outlines used at build time |
| `src/styles.css` | Design tokens, responsive layouts, motion and print styles |
| `src/app.js` | Progressive enhancements and native dialog behavior |
| `src/render.mjs` | Shared escaped markup used by build and browser |
| `src/pricing.html` | Full pricing research page; shares the main page's header, footer and dialogs |
| `pricing/index.html` | Generated pricing page; do not hand-edit |
| `build.mjs` | Inlines the page assets and exports research manifests |
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

The site adds no analytics, accounts, trackers, cookies or remote fonts. Its only
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
CHROMIUM_PATH=/path/to/chromium python3 tests/browser_smoke.py
CHROMIUM_PATH=/path/to/chromium python3 tests/market_browser.py
CHROMIUM_PATH=/path/to/chromium python3 tests/readability_browser.py
# Optional deployed-build comparison and public-download verification:
MARKET_URL=https://theowlatlas.com CHROMIUM_PATH=/path/to/chromium python3 tests/market_browser.py
```

Tests cover five viewport widths, reduced motion, native modal opening/closing
and focus return, image-error states, anatomy, both sides of all eight comparison
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

## Deployment

Build the public-only folder with `npm run build:deploy` and set your static
host's output directory to `dist`. For an approved complete local-image set, use
`npm run build:deploy:local` instead. `scripts/prepare-deploy.mjs` stages only the
built HTML, code license, third-party notices and explicitly referenced local
images; it does not deploy anything. Preview with:

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
