# The Owl Atlas — launch handoff

**Deployment update:** see [LAUNCH_STATUS.md](LAUNCH_STATUS.md) for the current
public site at **https://theowlatlas.com/**, personal GitHub repository and launch checks. The
original handoff notes below are retained for context.

This is the **latest general-audience edition**, including the sourced Pi II,
Pi III and quadridigite exhibits. Use this project, not an earlier personalized
HTML or archive. The narrative, styling, source data and interactions are unchanged
in this handoff; launch packaging and instructions have been added.

## Give your coding agent this task

Read `AGENTS.md`, `README.md`, and `LAUNCH_CHECKLIST.md`. Prepare and validate
this existing website for the intended hosting environment without redesigning
it. Use `src/` as the source of truth and deploy only `dist/`. Preserve sources,
image attribution, catalogue dating distinctions, accessibility and the general-
audience framing. Verify real photograph delivery and resolve the flagged image
reuse decisions with the owner before public launch. Report the preview URL,
checks run and any unresolved blockers. Do not call it deployed without a real URL.

The same prompt is available in `HANDOFF_PROMPT.md`.

## Open the existing build

Open `index.html` to inspect the current site, or preview the prepared public
folder locally:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Visit `http://localhost:8000`. The page uses remote coin photographs and therefore
needs an internet connection for images. Code, content, styles, citations and
interactions are already included in the HTML. Coin photograph bytes are NOT
included in this ZIP; PNG files under `research/` are QA screenshots, not originals.

## Rebuild the launch folder

Use the Node version requirement in `package.json` (currently >=20). No npm
packages need installing for the build or structural checks.

```sh
npm run build:deploy
npm run check
python3 tests/integration_data.py
python3 tests/editorial_copy.py
```

Static-host settings:

- Project root: the extracted `owl-atlas` folder.
- Build command: `npm run build:deploy`.
- Publish/output directory: `dist`.
- No backend, database, API keys or runtime environment variables are required.
- For a manual static upload, publish the contents of `dist/`, not this repository.

Nothing has been published on your behalf. The staging script creates files;
it does not contact a host or register a domain.

## What is in the package

- `index.html`: current standalone build, identical to the supplied general-audience HTML.
- `dist/`: staged website plus implementation license and third-party notice files.
- `src/`, `build.mjs`, `package.json`: editable source and dependency-free build.
- `scripts/`: structural checks, deployment staging and optional image archiving.
- `research/`: source/image/specimen manifests, findings, QA reports and screenshots.
- `research/image-research/`: original supplemental gallery and its records, retained
  as research history, not as a competing version of the main site.
- `tests/`: data, editorial and optional Chromium browser smoke tests.
- `AGENTS.md`, `LAUNCH_CHECKLIST.md`: implementation constraints and release work.
- `MANIFEST.sha256`: file checksums for the delivered package, excluding itself.

## Important remaining release work

The existing manifests retain **six BnF photographs with reuse review pending**.
No new rights clearance has been obtained for this handoff. Keep the source
credits and caveats; do not treat the code's MIT license as an image license.
`THIRD_PARTY_NOTICES.md` and each image's original rights record carry the details.

Remote image availability, rights decisions, responsive loading and real-browser
photograph viewing still need checking online. Existing/fresh smoke tests deliberately
block remote photographs and cannot establish that the actual coin images load.
See `research/handoff-validation.json` for exactly what was rerun for this ZIP.
