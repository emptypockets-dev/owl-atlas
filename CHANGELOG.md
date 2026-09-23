# Laurion ore replaces chapter 01's map — 23 September 2026

- At the owner's request, chapter 01's static Athens & Attica map gives way to a
  photograph of Laurion ore: `laurion-galena`, argentiferous galena on public
  display at the Carnegie Museum of Natural History, photographed by James
  St. John on 30 January 2011 (CC BY 2.0,
  <https://www.flickr.com/photos/jsjgeology/49365343353>, 3,217 × 2,477 px).
  The exhibit label, as the photographer transcribes it, calls it an ore sample
  from the silver mines of Laurium. The record says it is a modern mineral
  specimen, not an ancient find; that the mine and collecting date are
  unrecorded; and that the edge of the exhibit label shows at the upper right.
- Why Flickr: Wikimedia Commons has no photograph of Laurion galena. Searched
  were the Galena category tree (31 categories), Minerals of Greece (44), the
  Lavrion mineral and mine categories and full-text searches in several languages,
  plus the Smithsonian open-access API, the NHM London data portal and
  Europeana. The Flickr page is the photographer's own and states CC BY 2.0.
  With no Commons license review behind it, the page was checked on
  23 September 2026 and the notices ask for a dated copy to be kept.
- No unstruck blank is added. No museum or excavation record found identifies a
  photographed silver flan as a blank for Athenian silver coinage: searches of
  the ANS collection found no unstruck flan from Attica, the Met and Smithsonian
  open-access searches returned none, and the Agora mint building's unstruck
  flans are bronze, for the bronze coinage. British Museum photographs are
  licensed for non-commercial use only and could not be used anyway.
- Chapter 01's third paragraph gains two sentences on the metal path: the silver
  came out of lead ore; smelting gave lead holding most often about two
  kilograms of silver to the tonne; cupellation under blown air oxidised that
  lead to litharge and left the silver. They cite new source 51,
  `laurion-cupellation`: George D. Papadimitriou, "Cupellation and litharge in
  their technological context at Laurion", Der Anschnitt Beiheft 50
  (Deutsches Bergbau-Museum Bochum, 2023), pp. 87–104, open access. It is
  appended, so no existing citation number moves; the companion page's own
  references shift by one. The copy does not call galena *the* ore, because
  Papadimitriou gives the smelting charge as mainly cerussite with galena up to
  about 20 per cent. The caption says what the photograph is: "Ore from the
  Laurion mines: galena, the lead mineral silver was recovered from. A museum
  specimen photographed in 2011, not an ancient find."
- Self-hosted derivatives at 800 and 1,600 px under `public/images/derived/`,
  manifest updated; the other eleven originals came from the checksum-verified
  cache and their derivatives are byte-identical. `photoSizes` gains
  `origins-photo`, `(max-width: 900px) 92vw, 40vw`, measured against the column
  (558 px at 1440, at most 640 px below 900). In the headless QA browser the
  home page measures 14,617 px at 1440 and 20,686 px at 390.
- `atticaLocatorMarkup()` and the `ATTICA_LOCATOR` token are removed, and
  `geographyMap()` loses the `idBase` parameter that existed only for them. The
  explorer's maps and ids are unchanged. The `.origins-map` rules give way to
  `.origins-photo` and `.origins-caption` in the story-order block.
- `scripts/check.mjs` replaces the static-map assertions with photograph ones:
  exactly one photograph, openable in the viewer, self-hosted srcset, credit,
  rights record and license, the caption, no map, and the cupellation citation.
  An appended block checks that every derived record's stated size equals its
  measured original, and pins `laurion-galena`'s license, reuse status, note,
  changes and rights link. `tests/editorial_copy.py`, `tests/browser_smoke.py`
  and `tests/reference_browser.py` look for the photograph and no map; the
  counts in `tests/editorial_copy.py`, `tests/integration_data.py` and
  `tests/one_owl_data.py` move to 18 images and 51 sources.
- `/kit/` lists the photograph automatically in its attribution group. The
  kit's paragraph in `THIRD_PARTY_NOTICES.md` still says fifteen photographs; it
  was left alone because `/kit/` is being removed in a separate change.
- In the headless QA browser Flickr answered the original, and its 2,048 and
  3,072 px sizes, with HTTP 429 while serving the 1,024 px size; curl with
  browser-style headers received the original. The page loads only the
  self-hosted copies. The viewer and the "Full-resolution original" link, which
  open the Flickr original, still need a check in a real browser.

---

# Dotted-theta interlude removed — 23 September 2026

- Remove the interlude between chapters 02 and 03, "Interlude / The city's
  signature" (`#theta`, "Three letters. One dot."), at the owner's request.
  The reason is the one the owner gave for the two removed chapters:
  repetition. The close reading in chapter 02 already has an ΑΘΕ detail, and
  the interlude was that detail's second half.
- The ΑΘΕ reading now carries the dotted theta itself, in two sentences:
  "ΑΘΕ abbreviates “of the Athenians.” On this coin theta is a circle with a
  central dot, the ancient counterpart of the printed Θ, and the form this
  atlas borrows for its own mark." It cites `openlearn-theta` beside
  `acropolis`, so both of the interlude's sources are still cited on the home
  page. No source or image record was dropped.
- Chapter 02's onward cue now reads "Now the year the war ended ↓", the
  interlude's own closing line, and lands on `#404`. The chapter bar runs from
  02 / The classical icon straight to 03 / War and its aftermath. The home page
  is 14,591 px at 1440, from 15,445, and 20,543 px at 390, from 21,582.
- Chapter 02's dark ground now meets the ink-dark 404 directly; the interlude
  was the light band between them. The seam is a slight tonal step, `--forest`
  to `--forest-deep`, where the 404's column rules begin.
- `/kit/` drops the "Three letters. One dot." short link, and its heading now
  promises four links: `#404`, `#beyond`, `/one-owl/` and `/pricing/`.
  `/#theta` no longer has a target and opens at the top of the home page.
- `scripts/check.mjs` replaces the interlude's eight checks with two on the
  ΑΘΕ reading: it carries the dotted theta, and it avoids the unsupported
  "letterform still in use" wording that `research/hooks-findings.json` ruled
  out. `tests/editorial_copy.py` checks that `#theta` is gone and that the
  reading cites both sources. The story-order, onward-cue and fragment lists in
  `scripts/check.mjs`, `tests/editorial_copy.py` and
  `tests/reference_browser.py` lose `theta`, and `tests/browser_smoke.py` no
  longer screenshots it.
- The `.theta-*` rules in `src/styles.css` are dead and are on the chunk-5
  polish list rather than removed here: `.theta-copy` shares two selector
  lists with live rules in the wide-screen sidenote block.

---

# Home page reordered: the coin first, the maps later — 21 September 2026

- The reader now meets the coin before the geography. Chapter 01, "Silver from
  Laurion", is a short opening on Attica, the Laurion mining district and the
  tetradrachm, beside one static Athens & Attica map, and then the minting
  illustration. It was 3,455 px, 633 words and 19 controls at 1440; it is now
  1,381 px, and the only thing to operate in it is the strike replay.
- The eight-region explorer moved whole into chapter 05, "An owl beyond Attica",
  where the chapter already argued that not every owl came from Athens. Every
  `#geography-<place>` id, the keyboard buttons, the mobile selector, the hash
  deep links, the overview sweep and the no-JavaScript reading came with it; the
  block selects by id, so nothing in `src/app.js` changed.
- The new chapter-01 map is `atticaLocatorMarkup()` beside `geographyMarkup()`:
  the explorer's own Athens view, same projection, scale bar, north mark and
  labels, drawn once as a static figure with no buttons. `geographyMap()` gained
  an optional id base so the same place can be drawn twice in one document.
- Chapter 02, "The classical icon", moved to `section-dark`, so the close
  reading reads like a museum vitrine. The three controls that were painted for
  a paper ground — the pressed detail button, its hover, and the face switch —
  are restated for the dark ground at 14.5:1 for the label and 5.2:1 for the
  numeral. The chapter's prose column is one lead sentence and the specimen
  ticket; the paragraph that restated what the close reading shows is gone.
- Chapter 06, "How we know", was halved: 1,778 px to 990 px. Four kinds of
  evidence as one-liners with their citations, then Nikophon's law of 375/4 BCE
  — the public approver in the Agora, the coin with a bronze or lead core cut
  through, and the piece that became sacred property of the Mother of the Gods.
  The wording is the phrasing already vetted in `research/hooks-findings.json`
  and on `/kit/`, and `scripts/check.mjs` now holds the three copies together.
  The isotope research feature and the euro coda went, because `isotopes` and
  `ecb` are both still cited on the page — `isotopes` three times, `ecb` in the
  hero fact strip. No source or image record was dropped.
- The `#atlas` invitation section became a compact continue row of three
  destinations — the reference atlas, the identifier and the creator kit —
  keeping its id. The One Owl invitation now ends the page, immediately before
  the footer, on `--forest-deep` so it does not read as the same dark twice.
- Every chapter 01–07 and the interlude now end with a one-line mono link to
  the next section, in static markup: "Now meet the classical owl ↓" was the
  model and is still chapter 01's, in the minting footer.
- Chapter numbers are unchanged, 01–07. The home page is 15,531 px at 1440,
  down from 17,563. `/kit/` gains the fifth short link its heading promised:
  `theowlatlas.com/#beyond` for the maps.
- Styles are one appended `CHUNK 6 / STORY ORDER` block, per the chunk-2 lesson.
  Nothing above it was edited. The only pre-existing declarations it reaches are
  the paper-ground control fills, restated under `.section-dark`.

---

# Early-owls chapter removed — 21 September 2026

- Remove chapter 02, "The owl takes shape", at the owner's request. Two museum
  plates and a terminology paragraph were asking readers for attention on
  subtle differences, which is the repetition the owner named.
- Keep what was interesting, in one place each and briefly. The Wappenmünzen
  note and the open question about when and why Athens adopted Athena and her
  owl now open the classical chapter, above "An owl becomes an icon", with one
  quiet link to `atlas/#family-archaic` for readers who want to see the
  earliest owls. The archaic frontal eye of c. 520–510 BCE is one clause in the
  "Athena's eye" reading, which stays at three sentences. The two senses of
  "transitional" are a new atlas glossary entry citing NGC and the profile-eye
  source; the "refinement without forgetting" observation was already the
  early-classical family card's feature line and was not duplicated.
- No source or image record was dropped. The archaic and early classical
  photographs simply leave the home page: they are still displayed on `/atlas/`
  in the family cards, in the `#identify` figures and in `/kit/`, and none of
  them is reuse-review-pending. All 50 sources, all 17 image records and all
  three BnF specimens are retained.
- The minting illustration's onward link now reads "Now meet the classical owl"
  and lands on `#classical`. Chapters 03–08 become 02–07, in the eyebrows, the
  chapter-bar labels and the one line of `/atlas/` copy that named a chapter.
- Styles are one appended `CHAPTER 02 OPENING` block: a single rule giving the
  new atlas link its space under the deck. The rules that only served the
  removed chapter are dead and are listed on the chunk-5 polish list rather
  than removed in the same commit.

---

# Close reading restored, fourth-century chapter folded in — 21 September 2026

- Restore the interactive close reading in chapter 03, in the slot the Anatomy
  exhibit left empty. It is rebuilt from `research/previous-close-reading/` in
  the current type and the chunk-2 set-piece language: a native radio pair
  chooses the face, detail buttons choose a reading, and a numbered gold-ringed
  marker moves over the photograph. Both faces of Cleveland 1941.296 and all six
  readings, with every citation, are rendered at build time; without JavaScript
  they are simply all on the page and the controls stay hidden. The readings
  live in `src/content.json` under `closeReading`, the markup in
  `closeReadingMarkup()` behind a `{{CLOSE_READING}}` token, the styles in one
  appended `CHUNK 5 / CLOSE READING` block, and the script in a matching block
  at the end of `src/app.js`.
- Cut the repetition the owner named. The "Three letters" reading is now a
  single line that hands ΑΘΕ to the theta interlude rather than telling the same
  story twice, and no reading runs past three short sentences.
- Remove chapter 05, "A familiar owl, a changing Athens". Its two real points
  are now the two obverse readings: Athena's eye turning into profile in the
  fourth century, with the caveat that eye shapes overlap and cannot date a
  coin, and the helmet ornament that names the Pi-style family. A closing line
  carries the third-century Old Style into the two comparison presets, so
  `/atlas/?compare=pi-pair#atlas` and `/atlas/?compare=late-bridge#atlas` are
  still reachable from the story. Chapters 06–09 become 05–08.
- Nothing sourced was dropped. The Pi II exhibit — both photographs, the BnF
  provenance, "A classification is not a date" and its preset link — moved to
  `/atlas/` under the family tree, with the "reuse review pending" notice beside
  it. The heterogeneous Group C point moved into the later Old Style family
  card's attribution notes, and the Pi II dating caveat into the Pi-style card's.
  All 50 sources, all 17 image records and all three BnF specimens are retained;
  all six BnF photographs are still displayed, still hotlinked unchanged, and
  still carry their reuse flags.
- `/pricing/`'s "Revisit Athena's helmet" now lands on the restored helmet
  reading. The browser suites drive the comparison presets and the BnF specimens
  on `/atlas/`, where they now live, instead of on the home page.

---

# Anatomy exhibit removed — 21 September 2026

- Remove the eight-step “Anatomy of an Owl” exhibit from chapter 03 at the
  owner's request, along with its creator-kit short link. The theta interlude
  now follows the paired Met exhibit directly.
- Archive the close reading that preceded it under
  `research/previous-close-reading/` (readings, markup, script and styles from
  the commit before the prototype) so it can be restored if wanted.
- Stop inlining `src/artifact-explorer.js`; the module and its geometry test
  stay in the repository unused. The Cleveland image records no longer describe
  the exhibit's display crop.

---

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


# A creator kit — 21 September 2026

- New page at `/kit/`, assembled from `src/kit.html` by `build.mjs` exactly like
  the other sub-pages: the shared head and chrome, its own title, description and
  share metas, a `CreativeWork` JSON-LD block, the chrome strip label
  `CREATOR KIT`, and a sitemap entry. `scripts/prepare-deploy.mjs` stages it.
- **Use these pictures.** Every rights-cleared photograph on the site — eight CC0
  and public-domain museum files, one CC BY 2.0 and two CC BY-SA 3.0 Wikimedia
  files, and the owner's four CC BY 4.0 photographs — with a preview, the
  self-hosted resized copies, the untouched original, the rights record, the
  licence with its deed link, and a ready-made credit line. Groups are selected
  by licence, so a new photograph appears automatically and a reuse-review-pending
  one cannot. The six BnF photographs are named as excluded, with the reason and
  a link to the image-use policy on `/atlas/`.
- **Say these things.** The ten verified hooks from `research/hooks-findings.md`,
  each a quotable one-liner, a two-sentence expansion, a collapsed
  “Before you post this” with every qualification the research recorded, and a
  citation chip. Two standing warnings lead the section: Mint State belongs to
  NGC 2086328-049 and to nothing else, and Rackham and O'Neill may still be in
  copyright. A closing list names the four claims that could not be verified —
  silver purity, mintage, a test-cut proportion, and the sentence misattributed
  to the ANS — so a creator knows not to post them.
- **Link back.** The credit line, the request to link the chapter rather than the
  front door, and copyable short URLs for `/#404`, `/#anatomy`, `/#theta`,
  `/one-owl/` and `/pricing/`.
- **Share cards.** All five `public/social/*.png` cards as downloads, with a link
  to the on-site card maker at `/#share-card` that is an ordinary link home until
  that anchor exists.
- Nine hook source records appended to `src/content.json` (44–50 are new; 42 and
  43 were already there), all `accessed` 2026-09-21. The two ANS collection
  records are recorded over HTTPS. Sources that support only the hooks ranked
  below the top ten are not added.
- New `kit` share card, 1200 × 630, “Use the owl. Credit the atlas.” over three
  coins, one per licence family the kit hands out. `scripts/render-social.mjs`
  refuses a reuse-review-pending photograph, so none can reach it.
- The footer on every page gains a “For creators” link. The primary navigation
  does not: a fifth item fits at 1024 px but overflows the header row by 108 px
  at 1101 px and above, where it would wrap and break the header height.
- Copying a credit or a link is progressive enhancement. The page's own small
  script adds the class that reveals the buttons, so without JavaScript every
  credit line is simply selectable text and no dead control is shown.
- `npm run check` gains the kit's own head, identifier, link and structured-data
  checks, plus: no reuse-review-pending photograph is shown, linked or offered;
  every download resolves to a declared derivative, a staged file or an HTTPS
  original; every fact cites an existing source id and carries its
  qualifications; Mint State appears only in the one-coin warning; the kit card
  is 1200 × 630; and the sitemap lists `/kit/`.
- No new dependency, no analytics, no scroll hijacking, no new photograph. The
  existing image records, reuse flags, sources and section links are unchanged.

---

# Which owl does this resemble? — 21 September 2026

- Add a guided, five-question flow to the reference page at `/atlas/#identify`,
  above the comparison tool: Athena's eye, the helmet crest, a Π-shaped helmet
  ornament, a wreath, an amphora with long inscriptions, and a sixth question on
  lettering that is not Greek. Each question shows a small illustrative crop and
  carries a "Not sure / can't tell" answer that keeps every family in view.
- Resemblance, never attribution. A visible caution states that the flow does not
  date, grade or value a coin, and that only physical examination and a
  specialist opinion can attribute one. The words "authenticate", "genuine" and
  "guarantee" are absent from the feature and a check keeps them out.
- Record the observable traits per family in a new `identify` block in
  `src/content.json`, each trait tied to existing bibliography ids. No source was
  added. A trait this edition has not established is stored as `varies`, which
  never rules its family out — which is why Later Old Style and the Egyptian
  owl-type issues survive most answers, and the table says so.
- Result cards reuse the family faces, the family's pricing note and, for
  Pi-style and Later Old Style, the comparison presets the story already links.
  The cards live in an inert `<template>` until a question is answered, so an
  untouched form fetches no photographs.
- Readable without JavaScript. The build renders a decision table of all eight
  families and six traits with a citation in every cell, opened by default and
  preceded by four worked "if … look at …" readings derived from the same data.
  The form and result panel stay `hidden` until `src/app.js` reveals them, native
  radios in a real `<form>` keep the flow keyboard-operable at 44 px targets, and
  the result count is announced politely.
- The homepage's "Continue exploring" section gains one quiet link into the flow.
- Six illustrative crops, all from rights-cleared photographs. The six
  reuse-review-pending BnF files are never used to illustrate a question; they
  appear only inside result cards, exactly as they already do in the family grid.
- Fix a one-line bug in `scripts/check.mjs` from the previous entry: the minting
  stylesheet slice ended before its own end marker, so the check that followed
  could never pass and `npm run check` failed for every change.
- No dependencies, no new sources or photographs, no scroll hijacking. Existing
  image records, reuse flags and section links are unchanged.

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
