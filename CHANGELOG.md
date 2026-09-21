# Reasons to post — 21 September 2026

- Give every chapter heading a "Copy link" control. It copies the canonical
  address with the chapter's own bookmark — `https://theowlatlas.com/#404`,
  `https://theowlatlas.com/atlas/#sources` — taken from each page's `<link
  rel="canonical">`, so a local preview still hands out the production URL. The
  control keeps a 44px target, stays in the tab order, is quiet until the
  heading is hovered or it takes focus on a pointer device, and is always
  visible at its smallest size on a touch screen, where there is no hover to
  discover it with. A polite live region says "Link copied" for a screen reader.
- Add a Share pair to the chapter bar and to the sub-pages' chrome strip:
  "Share" hands the current chapter's label and URL to `navigator.share` where
  the browser has one and copies the link where it does not, and "Make a card"
  opens the new card maker. Both shrink to their icons and their accessible
  names below 900px. A quiet "Make a share card ↗" sits under the hero fact
  strip, hidden until JavaScript unhides it.
- Add a native `<dialog>` that composes share cards with `<canvas>`, in
  portrait 1080×1350 and landscape 1200×630, and offers Download plus Share
  (the latter only where `navigator.canShare({files})` is true). Five presets:
  the owl (Cleveland 1941.296.b), Athena (1941.296.a), four days' pay for a
  craftsman on the Acropolis in 408/7 BC (IG I³ 476, source 42), the owl on
  Greece's €1 coin today (ECB) on the New Style owl, and "2,400 years. Still
  here." on the owner's own owl, which stays a claim about that one coin.
- The cards are drawn in the reader's browser and never uploaded. They reuse
  the palette, the Fraunces and GFS Didot type, the dotted-theta wordmark, the
  coin discs and the layout of `scripts/render-social.mjs`, loading the display
  faces through `document.fonts.load` with the stylesheet's metrics-matched
  Georgia behind them. `classic-athena` needed a disc of its own; it was
  measured off the museum's frame and trued against a rendered card.
- Only rights-cleared photographs can reach a card. Every preset names a record
  in `src/content.json` or `src/one-owl.json`; `npm run check` fails if one is
  missing, is flagged `reuseStatus: "review-pending"`, disagrees with the frame
  the disc was measured against, or has no file on disk. The runtime resolves
  paths from the page's own inlined records, refuses anything that is not a
  same-origin file under `/public/images/`, and drops a review-pending record
  even when it is handed a perfectly good local file. Nothing is fetched across
  origins, so the canvas is never tainted and the export cannot fail that way.
  The owner's owl carries the credit its own rights note prescribes, "The Owl
  Atlas (theowlatlas.com) · CC BY 4.0", because the home page does not inline
  that record.
- All of it is enhancement. The copy and Share controls exist only at runtime —
  `npm run check` asserts they are absent from the built markup — the dialog
  ships inert, every transition is off under `html.motion-off` and the
  operating system's reduced-motion preference, and the whole set leaves the
  printed page. No dependencies, no new photographs, no content records
  touched.

---


# The strike, in motion — 21 September 2026

- Animate the existing three-step minting diagram once, when the section is
  read: the dies draw themselves in, the blank falls and settles on the lower
  die, then the hammer falls, an impact ring spreads and the blank becomes a
  struck disc. About four and a half seconds, on the shapes that were already
  there plus an impact ring and a faint relief hint.
- The struck disc carries no design. Nothing in the sequence adds an owl, an
  Athena, a letter or any other device to the dies, and the footer now says so
  beside the existing schematic disclaimer. See `research/minting-findings.json`.
- Add a generic `data-animate-on-view` hook to `src/app.js`: an
  IntersectionObserver adds `is-playing` once, and a `[data-animate-replay]`
  control restarts the sequence. A mono "Play again" button at the 44px touch
  target sits beside the copy; a thin rule under the existing 01/02/03 labels
  marks the step under way, and no state is announced.
- Motion stays optional. Without JavaScript, with the motion toggle off, under
  the operating system's reduced-motion preference and in print, the three
  diagrams, their titles, descriptions and prose are exactly as drawn, the new
  relief hint and impact ring stay invisible, and the control is not shown.
- No dependencies, no scroll hijacking, no new photographs. Existing sources,
  image records, reuse flags and section links are unchanged.

---

# One owl, one lit object — 21 September 2026

- Lead the companion story with a single large owl instead of two side-by-side
  slab photographs. The reverse close-up becomes a circular display crop lit with
  the home hero's language: a vignette on the section, a warm spotlight behind the
  disc, a hairline ring. No turn and no fabricated thickness — one photograph of
  one side. On phones the coin leads and the words follow, as the home hero does.
- Move Athena to a smaller disc beside the specimen facts. Both faces keep their
  eyebrow label, their visible credit and their route to the complete frame.
- Both crops are declared transformations, not new files. Each circle was measured
  off the owner's own 960×1280 JPEG — the owl r=430 px at (433, 745), Athena
  r=372 px at (510, 730) — and is drawn in CSS over the unchanged bytes. The
  photograph record now states both measurements and shows all four complete
  frames; "Look closer" still opens each untouched original. Holder prongs,
  reflections and plastic marks are retained, never retouched.
- Record the owner's release of all four photographs under CC BY 4.0, dated
  21 September 2026, with the deed URL, the credit "The Owl Atlas
  (theowlatlas.com)" it requires, and the statement that the site code's MIT
  licence does not cover photographs. Updated in `src/one-owl.json`, on the page,
  in `THIRD_PARTY_NOTICES.md` and on the one-owl share card. The JPEG bytes and
  their SHA-256 checksums are unchanged.
- Add checks that all four records carry the CC BY 4.0 deed URL, that the page
  states the required credit, and that the stylesheet percentages are the
  arithmetic of the measured circles, so a crop cannot silently drift off the coin.

---

# Geography that looks like a sea-going economy — 21 September 2026

- Paint the eight area maps and their locators in layers instead of on a flat
  beige background: a blue-grey sea, a shelf stroked under every coastline, a
  warm paper land, a quiet graticule on the water, and a fine ink coast. The
  water is now an SVG rectangle rather than a CSS background, so it prints.
- Give the highlighted area a soft gold halo and move its outline onto its own
  pass, so a selection can fade and draw itself in. Re-tune the sea labels,
  label halos, scale plaque and north mark against the new ground; `npm run
  check` now measures those contrasts and fails below 4.5:1 for text.
- Add one decorative overview of all eight areas beside the place buttons. When
  the explorer first scrolls into view the areas light up in turn over about two
  and a half seconds and then settle on whichever place is open. Approximate
  regions keep their hatch there, and the caption repeats that it is not a
  complete mint map.
- Respect every motion switch: with `Motion off`, `prefers-reduced-motion` or in
  print there is no sequence, no fade and no draw. Selection stays instant.
  Keyboard controls, the mobile selector, `#geography-*` deep links, the
  next-place affordance, the evidence links, the no-JavaScript reading of all
  eight entries and the print layout are unchanged, and nothing scrolls the page.
- Add no place, boundary, route or claim: every outline is the same public-domain
  Natural Earth geometry, and `src/geography.json` is untouched.

---

# How the owl was minted — 16 September 2026

- Add an original three-step SVG illustration between the silver-mining story
  and the early coin photographs: engraved dies, a silver blank, and the hammer
  strike. Labels and prose identify the lower obverse die and upper reverse die.
- Cite the Met's educational explanation as source 32. The diagrams are explicitly
  schematic, with simplified tools and no invented historical coin imagery.
- Keep all three steps visible, with accessible image descriptions, mobile and
  tablet layouts, and no JavaScript or animation dependency. An onward link leads
  to the early owls. Define “flan” here and remove its repeated definition below.
- Preserve the existing 31 sources, 17 photographs, specimen records and six
  pending image-reuse decisions. See `research/minting-findings.json`.

---

# Two-face close reading — 16 September 2026

- Add a native radio toggle between the owl/reverse and Athena/obverse in the
  interactive close reading. Each face has its own detail buttons, photograph,
  numbered marker and sourced explanation, and remembers its selected detail.
- Retain the existing six readings and Cleveland 1941.296.a/b photographs,
  original-image viewer, credits, citations and motion preferences. Move the eye
  marker onto Athena's visible eye after inspecting the real obverse photograph.
- Render both faces and all six explanations at build time for no-JavaScript
  reading and printing. Hide interactive controls when JavaScript is unavailable.

---

# Guided geographic explorer — 16 September 2026

- Replace the single numbered-pin map with eight selectable area views. Start
  inside Attica with Athens marked as a city and Greece shown in a contextual
  locator, then explore Sicily, Anatolia, Egypt, the Levant, Babylonia, Iran and
  Afghanistan, and Arabia. Native buttons, a mobile selector and next-place
  controls support keyboard and touch; every entry remains readable without
  JavaScript and in print.
- Use public-domain Natural Earth outlines and rivers, local SVG rendering,
  approximate scale bars and wider locator maps. Distinguish modern geographic
  outlines from broadly hatched historical regions; draw no inferred coin routes.
- Pair each area with its geographic relationship and source-linked coin evidence.
  Preserve all 31 source records, 17 photograph records, museum dates, credits,
  image interactions, six BnF review flags and existing section links.
- No dependencies, framework changes, map services, API keys or tracking added.
  See `research/geography-explorer-findings.json` for geometry provenance and limits.

---

# Athens, Attica and Greece — 16 September 2026

- Replace the ambiguous slash-separated map heading with an explicit sentence:
  Athens is a city in Attica, a region of present-day Greece. Explain that marker 1
  locates Athens and that regional and national boundaries are not drawn.
- Label Athens as a city in the map and numbered key; preserve the same hierarchy
  in the accessible map description. Let the adjacent prose focus on Athens as an
  ancient issuing city-state instead of repeating the geographic explanation.

---

# Map labels and scale — 16 September 2026

- Shorten all eight map connectors to leave clear space around names and subtitles;
  move the Athens label above its marker. Give lettering a narrow background halo
  so coastline strokes cannot obscure it. Geographic positions and coastline
  geometry are unchanged.
- Add a readable note above the map explaining that it spans thousands of
  kilometres, with enlarged markers and offset labels. Clarify that connector
  lines identify labels, not travel routes. Retain the historical scope, geographic
  qualifications, mobile key, accessible SVG description and Natural Earth credit.

---

# Circular-image labels — 16 September 2026

- Clip the photograph in its own frame so circular New Style images cannot cut
  off the “Look closer” label or keyboard focus outline. Center the labels near
  the lower part of each circle, clear of the overlapping portrait inset.
- Preserve the circular photographs, hover enlargement, viewer links and credits.
  The hero label remains hidden as previously requested.

---

# Early coin faces and heading — 16 September 2026

- Show labeled obverse and reverse views together for both chapter 02 examples,
  including on narrow screens. Reuse the archaic paired plate with its declared
  face crops and the matching Cleveland 1920.267.a/b photographs; preserve credits
  and full originals in the viewer.
- Replace the speculative “experiment” heading with “The owl, in its early forms.”
  The existing sources discuss a change in type and debated origins, without
  establishing that these examples were trial issues. Extend the chapter's
  introductory period label through the mid-fifth century to cover the displayed
  480–449 BCE museum record; no specimen or family dates change.
  Sources rechecked: [Davis et al. (2025), especially the discussion](https://link.springer.com/article/10.1007/s12520-025-02229-z)
  and [Cleveland 1920.267](https://www.clevelandart.org/art/1920.267).

---

# Story flow edit — 16 September 2026

- Give each narrative chapter a distinct purpose, tighten repeated geography,
  visual descriptions and general cautions, and introduce unfamiliar terms at
  first use. Preserve specific dating and attribution qualifications.
- Put the pre-owl coinage before the early photographs; continue from 404 BCE
  into chapter 05; mark regional issues as a return to parallel fourth-century
  traditions; add a closing link from the story into the reference atlas.
- Preserve all source, image, family and specimen records, the design and
  interactions. See `research/story-flow-review.md` for the editorial rationale.

---

# Geographic introduction — 16 September 2026

- Replace the Attica-only schematic in section 01 with an overview of Athens
  and the wider geography of owl coinage. Explicitly place Athens within Attica
  in present-day Greece, and distinguish minting, circulation and findspots.
- Add selected regional labels for Sicily, Anatolia, Egypt, the Levant,
  Babylonia, Iran/Afghanistan and Arabia. Separate related local issues from
  Athenian circulation; preserve attribution uncertainty and the mining story.
- Append three sources, retain the original 28, and credit Natural Earth's
  public-domain coastline geometry. No photograph or existing image rights changed.

---

# Hero hover label — 16 September 2026

- Remove the hero photograph's “Look closer” overlay at all screen sizes.
  Preserve its click/keyboard viewer access, focus indication and credits.
  Other photograph labels remain available.

---

# Matching early-classical reverse — 16 September 2026

- Locate Cleveland 1920.267.b, the CC0 reverse of the existing obverse 1920.267.a.
  Both museum records explicitly belong to parent accession 1920.267, dated
  480–449 BCE. Record the evidence in `research/early-classical-findings.json`.
- Fill the early-classical reverse in the family tree and comparison atlas,
  preserving the existing obverse. Use the museum's web JPEG on the page and
  full-resolution JPEG in the viewer; retain attribution and original-file links.
- Preserve all previous records and the six BnF review flags. There are now
  17 image records, with all eight family-tree entries illustrated on both sides.

---

# Paired family-tree photographs — 16 September 2026

- Show labeled obverse and reverse faces together on every family card, with
  two cards across on desktop and one on mobile. Retain each source's correct
  crop, attribution, reuse status and full original-image viewer link.
- Keep the early-classical reverse visibly identified as unavailable.
- Add the `#family-tree` deep link. Verify real hosted photographs, five viewport
  widths, viewer focus return and no-JavaScript content; see `LAUNCH_STATUS.md`.

---

# Launch preparation — 16 September 2026

- Added Vercel settings for the existing dependency-free build and `dist/` output.
- Restricted hosted access with Vercel Authentication; excluded previews from
  indexing and disabled automatic Git deployments while publication review remains.
- Corrected only the two Met image dimension records to the actual dimensions
  delivered by their unchanged source URLs: reverse 1,110 × 1,200 and obverse
  1,200 × 1,085. No photograph, attribution, chronology or narrative was replaced.
- Retained all six BnF reuse-review flags. See `LAUNCH_STATUS.md` for current
  deployment, verification and outstanding publication decisions.

---

# Research edition 03 — 16 September 2026

## Editorial revision: a general-audience atlas

- Recentered the opening around Athens, Attica and the coins’ historical setting.
- Rewrote the Classical and 404 BCE chapters around design, circulation and war.
- Replaced purchase-specific framing in specimen notes, family cards, comparisons
  and the Met source dialog with museum-object context.
- Moved catalogue-reading guidance into an optional native disclosure beside the glossary.
- Retained photographs, credits, source links, dating uncertainty, image-rights
  caveats, comparison presets, zoom controls and scroll behavior.
- Added editorial regression checks and disclosure keyboard/no-JavaScript checks.

This revision changes presentation and wording; it is not a fresh verification of
external sources, photograph delivery or image permissions.

---

# Research edition 02 — 16 September 2026

## Added

- Real Pi III and quadridigité exhibits replace the two missing-image sections.
- Pi II supplementary exhibit with both full-resolution faces.
- Three linked museum specimen records and six image records; 28 source records
  and 16 photographs now total, with original citation numbering preserved.
- Pi II/Pi III specimen selectors and two one-click comparison presets.
- Museum/object links and distinct reuse-warning panels in the zoom viewer.
- A sourced Heterogeneous Group C lead, explicitly not used as an illustration.
- Reuse-status export and a deliberate research-only downloader override.

## Preserved

- Original single-file scrolling site, design, chapters and reduced-motion behavior.
- No generated coin imagery, made-up labels, upscaling or retouching.
- Museum catalogue dates are separate from family chronology.
- BnF images remain remotely linked and reuse review remains pending.
- No deployment, external permission request or claim of specialist review.

## Validation

See `research/browser-qa.json` for the fresh browser smoke report and
`research/integration-qa.json` for source-manifest consistency checks. Remote
image delivery was not validated in this network-restricted environment.
