# The Owl Atlas

**A small owl. An ancient world.**

**Current launch status:** a restricted preview is now hosted on the owner's
personal Vercel account. See [LAUNCH_STATUS.md](LAUNCH_STATUS.md) for the URL,
live-image checks and unresolved publication decisions. The handoff descriptions
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

Edition 03 is an editorial revision, not a new source audit. All 16 image URLs,
attributions, rights caveats, 28 source records and three BnF specimens are retained.

## The experience

- Eight narrative chapters: Attica and Athens; early owls; classical mass issues;
  404 BCE; fourth-century changes; New Style; regional imitations; and evidence.
- Scroll reveals, restrained parallax, a chapter indicator and reading progress.
  Scrolling is never hijacked. OS reduced-motion preferences take priority.
- A six-part coin-detail reader and two-column, eight-family comparison atlas. Pi-style additionally has separate
  Pi II/Pi III specimen selectors, and story links preset meaningful comparisons.
- A native-dialog image viewer with source/rights metadata, fitted-size zoom,
  keyboard controls, drag and pinch handlers, and original-image links.
- Inline source dialogs, 28 bibliography records, author/topic filtering, 16
  image records, three structured BnF specimen records, a glossary and a visible
  editorial coverage register.

## Edit and build

Node 20 or newer is sufficient. There are no npm dependencies to install.

```sh
npm run build          # rebuild index.html from source files
npm run check          # check references, IDs, rendering and JavaScript syntax
```

| File | Responsibility |
| --- | --- |
| `src/page.html` | Narrative, semantic document structure and build tokens |
| `src/content.json` | Authoritative sources, image records, families and glossary |
| `src/styles.css` | Design tokens, responsive layouts, motion and print styles |
| `src/app.js` | Progressive enhancements and native dialog behavior |
| `src/render.mjs` | Shared escaped markup used by build and browser |
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

## Deployment

Build the public-only folder with `npm run build:deploy` and set your static
host's output directory to `dist`. For an approved complete local-image set, use
`npm run build:deploy:local` instead. `scripts/prepare-deploy.mjs` stages only the
built HTML, code license, third-party notices and explicitly referenced local
images; it does not deploy anything. Preview with:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

The output is static. Upload `index.html` to any HTTPS static host. With local
photography, also upload `public/images/`. No server code is needed. Do not deploy
research notebooks or test files unless intentionally making the source public.
Nothing in this delivery has been published or deployed on your behalf.

## Rights

Original implementation code is provided under MIT; see `LICENSE`.
**Photographs and source publications are not relicensed under MIT.** Retain the
creator, institution, original-record link, license and modification notes
attached to each image. Review `THIRD_PARTY_NOTICES.md` and the image manifest
before redistribution. No museum, researcher or photographer endorsement is
claimed or implied.
