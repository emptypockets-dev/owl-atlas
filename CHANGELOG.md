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
