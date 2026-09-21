# Making the Owl Atlas shareable — working plan

Goal: someone who lands on theowlatlas.com is excited enough to post it. The
site stays a source-linked research edition; every change below keeps the
editorial invariants in `AGENTS.md` (no fabricated coin imagery, credits and
licenses attached, the six BnF review-pending photographs hotlinked and
unmodified, readable without JavaScript, accessible, no tracking without
authorization).

Clarification from the owner: "Mint State after 2,400 years" describes one
specific coin, the owner's NGC 2086328-049 on `/one-owl/`. Owls in general are
not Mint State. Any hook that uses the fact must say "one owl" and point at the
companion page.

Work is delivered in chunks. After each chunk the site is rebuilt into `dist/`
and served on http://localhost:8000 for review before the next chunk starts.
Nothing is deployed or pushed without an explicit request.

## Chunk 1 — The arrival

- Self-hosted optimized photograph derivatives for every rights-cleared image;
  the hero no longer loads a 5.7 MB original. Preload, preconnect, blurred
  placeholder in the hero disc. The BnF six stay hotlinked.
- Open Graph and Twitter large-image cards for all four pages, JSON-LD with
  licensable ImageObject records, sitemap update.
- Mobile hero shows the coin first. The header hides on scroll-down and returns
  on scroll-up. The motion toggle moves out of the header into the chapter bar.

## Chunk 2 — Beauty

- One self-hosted display serif (choice pending owner decision).
- Hero as an object in a room: spotlight, specular sweep, one owl-to-Athena turn
  on first view, reduced-motion aware.
- New set pieces: the dotted theta as a giant glyph; "80–100 generations" on
  the home page (one coin, companion link).
- Citation chips become margin sidenotes on wide screens.
- Hero copy leads with the hooks; page titles gain a hook while keeping the
  poetry.

## Chunk 3 — Motion and maps

- Minting illustration animates as a three-frame strike loop.
- Geography explorer gains sea and land contrast and a region-by-region reveal.
- One Owl hero crops in on the owl; full frames stay in the record.

## Chunk 4 — Reasons to post

- "Which owl does this resemble?" five-question identifier from the eight
  families. Resemblance framing only, never authentication.
- Coin-card maker: one tap composes a share image from rights-cleared
  photographs with credit baked in; native share sheet; copy-link per chapter.
- Creator kit page listing reusable images, facts, credits and a link-back
  request; the review-pending images are explicitly excluded.
- Purchasing-power fact with a new source record.
- Pricing chart as the preview image for `/pricing/`.

## Chunk 5 — Ship

- Analytics only if authorized. Full QA: `npm run check`, Python tests, browser
  suites where available, real-device screenshots. Update CHANGELOG,
  LAUNCH_STATUS and README. Deploy on request.

## Owner decisions (21 September 2026)

- Display font: Fraunces, chosen from the localhost sample page
  (`docs/font-samples/`) over Instrument Serif and GFS Didot. Self-hosted
  variable woff2 with the opsz, wght, SOFT and WONK axes; `wght` must be set
  explicitly because the file's default weight is 900.
- The owner's four One Owl photographs may be offered for reuse under CC BY 4.0
  with credit to The Owl Atlas. Museum CC0 images are included regardless.
- Vercel Web Analytics (cookie-free) is authorized; enable it in the final chunk
  and record the authorization in `AGENTS.md`.

## Status

- Chunk 1: merged 21 September 2026. Hero derivative 215 KB (1×) / 773 KB (2×)
  instead of 5.7 MB; share cards and JSON-LD on all four pages; phone hero
  coin-first; header hides on scroll-down; motion toggle in the chapter bar.
  Review screenshots: `node scripts/qa-shots.mjs`.
- Chunk 2: merged 21 September 2026. Fraunces with a metrics-matched fallback
  and GFS Didot for Greek; hero spotlight, sweep and owl-to-Athena turn with a
  "Turn the coin" control; sourced hero deck and three-fact strip (sources 42
  and 43); page titles with a hook; dotted-theta interlude (`#theta`);
  "80–100 generations" invitation; margin sidenotes for citations on wide
  screens; labelled sub-page strip; share cards re-rendered in Fraunces.
  Lesson: never resolve an end-of-file stylesheet conflict by concatenating
  both sides; rebuild as base plus each branch's appended block.
- Chunk 3: merged 21 September 2026. Minting illustration plays a schematic
  strike once in view with a replay control; geography explorer has sea and
  land tones, coastlines, a gold region with glow, an eight-area overview and
  a sequenced reveal; One Owl leads with one lit owl in a measured circular
  crop, and all four owner photographs now carry CC BY 4.0 with the credit
  "The Owl Atlas (theowlatlas.com)".
- Chunk 4: merged 21 September 2026. Six-question resemblance identifier on
  `/atlas/#identify` with a no-JavaScript decision table; copy-link on every
  chapter heading, a Share control in the chapter bar, and a share-card maker
  (1080×1350 and 1200×630, five rights-cleared presets); creator kit at
  `/kit/` with 15 reusable photographs, ten sourced facts (sources 44–50),
  credit lines and short links, plus its own share card.
  PAUSED here at the owner's request for tweaks; chunk 5 waits for a go.
- Owner-requested edit, 21 September 2026: chapter 05, "A familiar owl, a
  changing Athens", is removed. The owner's reason was repetition — the site was
  asking readers for paragraphs about subtle differences. The interactive close
  reading is restored in chapter 03 in its place, rebuilt from
  `research/previous-close-reading/` in Fraunces and the chunk-2 language, with
  the "Three letters" reading reduced to one line that hands ΑΘΕ to the theta
  interlude. The withdrawn chapter's two real points became the two obverse
  readings (the eye turning into profile; the helmet ornament that names
  Pi-style), and a closing line carries the third century into the two
  comparison presets. The Pi II exhibit, the heterogeneous Group C note and the
  BnF reuse notice moved to `/atlas/`; no source or image record was dropped.
  Chapters 06–09 renumbered to 05–08. Styles are one appended
  `CHUNK 5 / CLOSE READING` block, per the chunk-2 lesson above.
- Polish list for chunk 5: the "Hammer" label overlaps the moving hammer
  mid-animation; hide the hero's honesty note on phones; round the focus ring
  on pill buttons; remove dead `.journey-faces` rules; distinguish the two
  Kroll 2011 sidenote labels; restore the motion toggle to the 44 px scans in
  `tests/artifact_browser.py` and `tests/one_owl_browser.py`.
- Chunk 4 prep: `research/hooks-findings.md` ranks ten verified hooks.
