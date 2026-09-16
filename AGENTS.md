# Coding-agent instructions

## Task and scope

Launch the existing Owl Atlas general-audience research edition. Preserve its
editorial design and source-grounded content. Do not rebuild it in React/Next.js,
introduce a CMS, add dependencies, add analytics or redesign it just to deploy.
If an existing repository requires integration, make the smallest compatible change.
The owner has requested a handoff; this ZIP has not itself been deployed.

Read `START_HERE.md`, `README.md`, `LAUNCH_CHECKLIST.md` and
`THIRD_PARTY_NOTICES.md` before publishing. Use the owner's intended host/repository
when available. Do not create paid resources, buy a domain or add tracking without
authorization. Do not guess a production domain.

## Canonical files and build

Edit narrative/markup in `src/page.html`, styling in `src/styles.css`, shared
rendering in `src/render.mjs`, interactions in `src/app.js`, and authoritative
content in `src/content.json`. Generated `index.html` and exported manifests under
`research/` should not be hand-edited.

`npm run build:deploy` rebuilds and stages `dist/`. Publish that directory only.
The build uses Node built-ins; `npm install` is not required. No runtime services,
secrets or framework routing are needed. Preserve hash links to sections.

After intentional, approved image archiving, `npm run build:deploy:local` creates
a local-image version. It requires all expected local image records. Read the
existing archiving documentation: the default download command skips the six
review-pending additions and reports an incomplete image set. The explicit
`--include-review-pending` option is for deliberate research use, not permission
for public reuse. Do not silently clear flags to make a build succeed.

## Editorial and image invariants

- Address people interested in the coins generally; no references to an owner's
  purchase, slab or label. Catalogue-reading help is optional and collapsed.
- Preserve the 31 source records, 17 image records, three BnF specimen records,
  primary-source links, qualifications and visible coverage gaps unless a
  documented editorial correction warrants a change.
  The seventeenth image is the documented matching early-classical reverse;
  see `research/early-classical-findings.json` for the museum accession evidence.
  Sources 29–31 support the geographic overview; see `research/geography-findings.json`.
- Museum catalogue dates and atlas period dates are distinct. Never make an
  approximate or debated chronology look exact for a cleaner animation.
- Keep Pi II, Pi III and quadridigite attribution linked to the exact museum
  specimen and side. Do not use an unrelated owl as a missing-image substitute.
- Do not generate, upscale with invented detail, or fabricate historical coin
  photographs. Preserve available originals for the zoom viewer. Use optimized
  derivatives for page loading only when allowed, with declared transformations.
- Keep creator/institution, source, license, reuse flags and modification notes
  attached to each photograph. The implementation MIT license excludes them.
- This is a research edition with known gaps, not a completed or certified
  definitive corpus. Do not imply museum endorsement or authentication advice.

## Behavior and accessibility

Retain semantic HTML, one main heading, skip navigation, keyboard access, visible
focus, native dialog focus/close behavior, motion controls, OS reduced-motion
preference, touch-friendly controls and a readable no-JavaScript story. Do not
hijack scrolling. Keep the Pi II/Pi III comparison presets, both coin faces,
source dialogs, bibliography search and zoom/pan interactions functional.

## Validation and reporting

Run `npm run check`, both standard-library Python tests, and the optional browser
suite when Chromium/Playwright are available. The browser suite intentionally
blocks image requests, so independently inspect real hosted photographs online.
Read `research/handoff-validation.json`; it separates automated checks from work
not completed. Retest the actual HTTPS preview, mobile layouts and deep links.

The deliverable is the deployed preview/production URL when authorized, a concise
change summary, actual test results and unresolved launch blockers. Do not claim
publication, rights clearance, remote-image verification, accessibility
certification or cross-browser coverage without doing the corresponding work.
