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
