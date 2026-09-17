# Public-launch checklist

Current deployment and completed checks are recorded in
[LAUNCH_STATUS.md](LAUNCH_STATUS.md). Public launch completed on 17 September 2026
at **https://theowlatlas.com/**. Checked items below were completed; unchecked items
retain their original follow-up scope.

The owner chose to retain the six BnF photos with existing notices; see
[the publication decision](research/publication-decision.md). This records the
owner’s choice, not new rights clearance.

## Establish the target

- [x] Confirm the intended repository, host and preview/production target from the
  owner's existing setup. Do not register a domain or create paid services implicitly.
- [x] Use the latest general-audience edition, not earlier purchase-specific files.
- [x] Preview unchanged source first; avoid unrelated rewrites.

## Images and evidence — resolve before public release

- [x] Read `THIRD_PARTY_NOTICES.md` and `research/images-manifest.json`.
- [x] Resolve the six BnF `review-pending` records with the owner for the intended
  use. Keep evidence of the decision; do not treat a technical download as permission.
  If unresolved, retain a restricted preview rather than silently claiming clearance.
- [x] Verify each actual source image loads, matches the cited specimen/side and
  is not a thumbnail or HTML error response masquerading as a photograph.
- [ ] Archive only images approved for the intended use, retaining attribution,
  rights metadata and checksums. The existing script is supplied but live-host
  integration has not been verified in this handoff.
- [x] Test full-resolution zoom for the BnF specimens and paired-plate crops for
  the other examples. QA screenshots are not replacement coin images.
- [ ] If introducing optimized page images, keep originals in the viewer and keep
  credits, dimensions and transformation notes accurate. Do not invent detail.
- [x] Preserve chronology caveats and the visible coverage register. Seek specialist
  review before representing the project as a definitive numismatic reference.

## Build and stage

```sh
npm run build:deploy
npm run check
python3 tests/integration_data.py
python3 tests/editorial_copy.py
```

- [x] Set the host's build command to `npm run build:deploy` and output directory
  to `dist`; do not publish the full source tree or research screenshots by accident.
- [ ] For a complete approved local-image set, use `npm run build:deploy:local`
  instead, and verify the generated `dist/public/images/` paths load.
- [x] Use HTTPS. Test that root and section-hash URLs work on the chosen host.
- [x] Check header configuration does not block the inline script/style build or
  the required photograph hosts. Do not disable protections indiscriminately.
- [x] Keep the bundled code license and third-party notices available.

The local-image build remains unused; production uses the approved remote-image
edition. No image archiving or optimized derivatives were introduced.

## Real-browser acceptance

- [x] Run `tests/browser_smoke.py` with Python Playwright and an installed Chromium
  executable (see README). These are offline interaction smoke tests, not image checks.
- [x] Open the actual hosted preview with real photographs; inspect console/network
  errors and fallback messages. Test a slow connection and a failed image request.
- [x] Check narrow mobile and desktop layouts, chapter navigation, comparison
  selectors, Pi presets, both coin faces and bibliography filtering.
- [ ] Check viewer opening/closing, focus return, Escape, zoom/pan, keyboard controls
  and real touch interaction. Test reduced motion and no-JavaScript reading.
- [ ] Inspect Safari and Firefox as well as Chromium; perform keyboard and
  screen-reader review appropriate for publication.
- [ ] Measure image transfer sizes and layout stability. Do not load all originals
  eagerly just because the originals are high resolution.

## Site identity and release

- [x] Add canonical/social metadata, favicon and sitemap using the actual chosen
  domain/branding. No production domain is assumed in this package.
- [x] Keep staging/preview indexing appropriate until release; confirm the public
  release is discoverable only when approved. Do not add unrequested analytics.
- [x] Confirm clear image credits, source links and no implied institutional endorsement.
- [x] Report the real preview/production URL, deployment target, exact checks run,
  image status and any unfinished editorial coverage. Keep a rollback copy.
