# Public-launch checklist

Current deployment and completed checks are recorded in
[LAUNCH_STATUS.md](LAUNCH_STATUS.md); the checklist below remains the public-release gate.

This is a release checklist, not a claim that the boxes below have been completed.
The site already builds; online publication decisions and checks remain.

## Establish the target

- [ ] Confirm the intended repository, host and preview/production target from the
  owner's existing setup. Do not register a domain or create paid services implicitly.
- [ ] Use the latest general-audience edition, not earlier purchase-specific files.
- [ ] Preview unchanged source first; avoid unrelated rewrites.

## Images and evidence — resolve before public release

- [ ] Read `THIRD_PARTY_NOTICES.md` and `research/images-manifest.json`.
- [ ] Resolve the six BnF `review-pending` records with the owner for the intended
  use. Keep evidence of the decision; do not treat a technical download as permission.
  If unresolved, retain a restricted preview rather than silently claiming clearance.
- [ ] Verify each actual source image loads, matches the cited specimen/side and
  is not a thumbnail or HTML error response masquerading as a photograph.
- [ ] Archive only images approved for the intended use, retaining attribution,
  rights metadata and checksums. The existing script is supplied but live-host
  integration has not been verified in this handoff.
- [ ] Test full-resolution zoom for the BnF specimens and paired-plate crops for
  the other examples. QA screenshots are not replacement coin images.
- [ ] If introducing optimized page images, keep originals in the viewer and keep
  credits, dimensions and transformation notes accurate. Do not invent detail.
- [ ] Preserve chronology caveats and the visible coverage register. Seek specialist
  review before representing the project as a definitive numismatic reference.

## Build and stage

```sh
npm run build:deploy
npm run check
python3 tests/integration_data.py
python3 tests/editorial_copy.py
```

- [ ] Set the host's build command to `npm run build:deploy` and output directory
  to `dist`; do not publish the full source tree or research screenshots by accident.
- [ ] For a complete approved local-image set, use `npm run build:deploy:local`
  instead, and verify the generated `dist/public/images/` paths load.
- [ ] Use HTTPS. Test that root and section-hash URLs work on the chosen host.
- [ ] Check header configuration does not block the inline script/style build or
  the required photograph hosts. Do not disable protections indiscriminately.
- [ ] Keep the bundled code license and third-party notices available.

## Real-browser acceptance

- [ ] Run `tests/browser_smoke.py` with Python Playwright and an installed Chromium
  executable (see README). These are offline interaction smoke tests, not image checks.
- [ ] Open the actual hosted preview with real photographs; inspect console/network
  errors and fallback messages. Test a slow connection and a failed image request.
- [ ] Check narrow mobile and desktop layouts, chapter navigation, comparison
  selectors, Pi presets, both coin faces and bibliography filtering.
- [ ] Check viewer opening/closing, focus return, Escape, zoom/pan, keyboard controls
  and real touch interaction. Test reduced motion and no-JavaScript reading.
- [ ] Inspect Safari and Firefox as well as Chromium; perform keyboard and
  screen-reader review appropriate for publication.
- [ ] Measure image transfer sizes and layout stability. Do not load all originals
  eagerly just because the originals are high resolution.

## Site identity and release

- [ ] Add canonical/social metadata, favicon and sitemap using the actual chosen
  domain/branding. No production domain is assumed in this package.
- [ ] Keep staging/preview indexing appropriate until release; confirm the public
  release is discoverable only when approved. Do not add unrequested analytics.
- [ ] Confirm clear image credits, source links and no implied institutional endorsement.
- [ ] Report the real preview/production URL, deployment target, exact checks run,
  image status and any unfinished editorial coverage. Keep a rollback copy.
