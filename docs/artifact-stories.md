# Authoring artifact stories

The scrolling close reading at `/#anatomy` replaces the former hotspot reader. It uses one photographed obverse/reverse pair, with a sequence of declarative camera states. The implementation supports this two-face model; it is not a general multi-artifact or 3D reconstruction engine.

## Files and build

- `src/content.json`: authoritative story, photograph and source records.
- `src/render.mjs`: `artifactStoryMarkup(story, data)` generates the exhibit and citations.
- `src/artifact-explorer.js`: `ArtifactExplorer` selects steps and owns camera transforms; `artifactView` calculates their geometry.
- `src/page.html`: section introduction and `{{ANATOMY}}` insertion point.
- `src/styles.css`: exhibit layout, transitions and responsive behavior.

`build.mjs` currently renders `data.artifactStories.anatomy` into `{{ANATOMY}}`, and bundles the viewer with the shared application. A new story also needs a template insertion point and build mapping; adding a data key alone does not create an exhibit. Edit canonical files and rebuild; do not edit generated `index.html` or `dist/`. With JavaScript disabled, both complete photographs, all narrative steps and source links remain readable. JavaScript adds the sticky camera and step navigation. Scrolling stays native, reduced-motion settings remove the transitions, and shallow viewports or enlarged text can release the sticky layout.

## Story data

`data.artifactStories` is keyed by story ID. A story has this shape; abbreviated arrays below illustrate the schema rather than a complete replacement:

```json
{
  "anatomy": {
    "id": "anatomy",
    "specimen": "Cleveland 1941.296",
    "date": "449–440 BCE",
    "faces": {
      "obverse": {"image": "classic-athena", "label": "Athena · obverse"},
      "reverse": {"image": "classic-owl", "label": "Owl · reverse"}
    },
    "steps": [{
      "id": "eye",
      "label": "Athena’s eye",
      "title": "The face turns. The eye does not quite follow.",
      "paragraphs": ["The large almond-shaped eye appears almost frontal within the profile face."],
      "refs": ["cma-classic", "profile"],
      "state": {
        "side": "obverse",
        "focus": {"x": 0.775, "y": 0.48},
        "zoom": 2.2,
        "rotation": 0
      }
    }]
  }
}
```

Keep the key and `id` equal. Use the `obverse` and `reverse` face keys, in that order, and start with a whole obverse view. `image` references an existing `data.images` record, including its dimensions, alt text, attribution and rights. Both photographs must depict the stated specimen. The visible date is its museum catalogue range, not a substituted series chronology.

Each step needs a stable, unique `id`, a short navigation `label`, a `title`, plain-text `paragraphs`, existing source IDs in `refs`, and a `state`. Paragraphs are escaped as text; citations are appended to the last paragraph. Changing prose or camera values preserves bookmarks. Renaming IDs changes generated links such as `/#anatomy-detail-eye`; retain old anchors when restructuring. The former `/#anatomy-detail-square` now aliases the owl step, which retains the incuse explanation.

## Camera coordinates and outlines

`focus.x` and `focus.y` range from 0 to 1 across the **complete source photograph**, including its background: `(0,0)` is the upper-left corner and `(1,1)` the lower-right. Coordinates do not refer to the visible coin silhouette or a zoomed crop. `zoom: 1` is the fitted whole-photo view; larger values magnify relative to that fit. The longest image dimension fits within 88% of the shorter stage dimension, while both the initial fit and further magnification are capped at one source pixel per CSS pixel. This cap uses CSS pixels, not device pixels; the viewer cannot reveal detail absent from the photograph. `rotation` is an in-plane angle in degrees, independent of the automatic obverse/reverse turn.

A face may also include `outline: [[x,y], ...]`, a polygon using the same full-frame normalized coordinates. It masks the photograph’s background for presentation only. Keep the polygon outside surviving coin detail. The original photograph remains unchanged and available through **Full photograph**. The narrow edge shown during a turn is a decorative depth cue, not a measured edge photograph or reconstructed coin thickness.

To choose a focus point, serve the build locally and open:

```text
http://127.0.0.1:8765/?artifact-debug=1#anatomy
```

Click a feature in the camera to read its normalized coordinates. Copy suitable values into the step data and rebuild. This helper is enabled only on localhost/loopback hosts; it does not appear on public previews. Inspect the point at desktop and mobile sizes, and check the complete photograph before adjusting a mask.

## Validation

From the repository root:

```sh
npm run build:deploy
npm run check
node tests/artifact_geometry.mjs
python3 tests/integration_data.py
python3 tests/editorial_copy.py
```

Serve the staged build in a separate terminal:

```sh
python3 -m http.server 8765 --directory dist
```

The optional browser checks require a Python environment with Playwright and an available Chromium browser; neither is a site dependency:

```sh
python3 tests/artifact_browser.py
```

`BASE_URL` defaults to `http://127.0.0.1:8765`; `CHROMIUM_PATH` defaults to `/usr/bin/chromium`. Override them for an HTTPS preview or a different browser installation, for example:

```sh
BASE_URL=https://theowlatlas.com CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" python3 tests/artifact_browser.py
```

Geometry checks cover focus, rotation, aspect ratio and resolution limits. Browser checks exercise the actual photographs, responsive layouts, deep links, enlarged text, scrolling in both directions, interrupted turns and reduced motion. Reports and screenshots are written to `/private/tmp`. Also inspect real hosted photographs and their credits, keyboard navigation, the no-JavaScript story and the full-photo viewer. These checks are not an accessibility certification or cross-browser coverage. Publish `dist/` only after the repository’s required launch checks.
