# Photographs and source material

The main atlas references externally hosted photographs. The companion story
also includes four original owner-supplied JPEGs, described below.
The optional archival script preserves credit/license fields without relicensing
any material. The website's software license does not cover these photographs.

## Image groups

**Owner-supplied photographs / permission for this site**

- Four JPEGs of NGC 2086328-049, supplied 17 September 2026: obverse and reverse
  close-ups, and full-holder obverse and reverse views.
- Credit: “Photographs courtesy of the owner.” Permission covers inclusion in
  this owner-requested story; no general reuse license is granted.
- Files are published byte for byte under `public/images/one-owl-*.jpg`. No
  cropping, retouching, reconstruction or enhancement; full frames remain in
  both page and viewer. Reflections, holder prongs and plastic marks are retained.
- The files contain orientation, resolution, color-space and dimension metadata;
  no GPS or personal identifying metadata was found. No metadata was changed.
- Exact dimensions and SHA-256 checksums are in `src/one-owl.json`, exported to
  `research/one-owl-manifest.json`. These records belong to the companion page,
  separate from the main atlas’s 17 external image records.
- The software MIT license excludes these photographs, just as it excludes the
  externally hosted museum and other third-party photographs. NGC and auction
  photographs are linked as evidence but are not reproduced on the companion page.

**Cleveland Museum of Art / CC0 1.0**

- 1941.296.a and 1941.296.b, obverse/reverse. Gift of Dr. Jacob Hirsch.
- 1920.267.a and 1920.267.b, early classical obverse/reverse of the same coin
  (parent accession 1920.267). Gift of Harold W. Parsons. The museum's public
  records explicitly link both faces and designate them CC0.
- The early-classical reverse links the museum's 2,384 × 2,280 print JPEG,
  which is what the viewer and the full-resolution link open. Page loading now
  uses locally resized copies of that same file (see “Self-hosted display
  copies” below) instead of the museum's 750 × 717 web JPEG. Both show the full
  source frame. The TIFF master remains available through the linked museum and
  Commons records.
- The Athena image from 1941.296.a uses a browser-compatible JPEG derivative of
  a TIFF source; it is not an invented or AI-enhanced version.
- The Anatomy of an Owl prototype uses display-only polygons around the
  photographed rims, plus camera zoom/pan. No source image bytes are changed.
  The original frames remain available in the viewer and no-JavaScript exhibit.
  A brief CSS edge cue suggests a turn; it is not a measured reconstruction of
  this coin’s edge or thickness. The two photograph records declare these changes.

**The Metropolitan Museum of Art / Public domain**

- 2021.40.80, obverse/reverse. Bequest of Nanette B. Kelekian, 2020.
- The linked images delivered 1,110 × 1,200 pixels (reverse) and 1,200 × 1,085
  pixels (obverse) during the hosted-preview check on 16 September 2026.

**Exekias / Wikimedia Commons / CC BY 2.0**

- Archaic paired plate, `Greek Silver Tetradrachm of Athens (Attica).jpg`.
- Page displays may crop to one face; the viewer opens the complete photograph.

**Classical Numismatic Group, Inc. / Wikimedia Commons / CC BY-SA 3.0**

- `Sg2537.jpg`, early fourth-century profile-eye paired plate.
- `EGYPT, Persian Administration. Sabakes. Circa 340–333 BC.jpg`, paired plate.
- Side-selective page crops are declared; full plates remain available in the
  viewer. Preserve ShareAlike terms for adaptations when redistributing them.
  The shared source photo license does not automatically relicense the whole
  separately authored website.

**Marie-Lan Nguyen / Wikimedia Commons / Public domain**

- New Style obverse and reverse, photographed in the Bibliothèque nationale
  de France collection. The historical photographer upload notes contain an
  older dating range; this is explicitly not adopted as the atlas chronology.

**Bibliothèque nationale de France / Gallica via Wikimedia Commons / review pending**

- 1966.453.1475: Pi III; both faces, each 2,522 × 2,522 pixels.
- 1966.453.1478: quadridigité; both faces, each 2,679 × 2,679 pixels.
- 1966.453.1469: Pi II; both faces, each 2,624 × 2,624 pixels.
- Collection references: SNG France 1, Delepierre 1475, 1478 and 1469.
- The individual Commons records assert PD-France status. That is recorded as
  the hosting platform's assertion, not as a CC0 license or direct BnF permission.
- BnF separately publishes conditions for commercial/promotional reuse:
  https://www.bnf.fr/fr/commander-une-reproduction-avec-une-utilisation-commerciale
- All six image records carry `reuseStatus: "review-pending"`, a rights note and
  policy URL. The source HTML references these images; no original bytes are
  bundled, and no permission request has been sent.
- The default vendor script does not archive pending-review photographs. Its
  explicit research override preserves the unresolved status in the manifest.
- Each side uses its full source frame; no coin image is generated, retouched,
  upscaled or reconstructed. Museum catalogue dates are preserved verbatim in
  metadata even when broader than the atlas's family chronology.

## Self-hosted display copies

Eleven eligible photographs are shown on the page as locally produced, resized
JPEG copies under `public/images/derived/`, generated by
`scripts/derive-images.mjs` with macOS `sips` at 800 and 1,600 pixels wide
(plus 2,400 for the two Anatomy of an Owl faces) and JPEG quality 82.

- The transformation is a resize and a JPEG re-encode. Nothing is cropped,
  retouched, upscaled, reconstructed or AI-enhanced, and a requested width
  larger than the source is skipped. Two photographs, `Sg2537.jpg` and the
  Sabakes plate, produced no smaller copy and keep their existing display URLs.
- Every derived record states the transformation in its `changes` note, which
  appears in the image viewer and in the on-page image register.
- `image.url` is unchanged. The full-resolution original stays linked, and the
  viewer and the Anatomy exhibit's “Full photograph” link open that original.
- `public/images/derived/manifest.json` records the SHA-256 of each original,
  the tool and settings, and the size of every derivative. Credits, licenses
  and reuse statuses are copied unchanged; none is altered by this step.
- The six reuse-review-pending BnF photographs are excluded. They are not
  downloaded, not copied and not resized, and still load from their host.
- The hero photograph and the two Anatomy faces additionally carry a 24-pixel
  blurred loading placeholder inlined as a data URI. It is a loading
  affordance derived from the same file, never offered as the photograph.

## Exact records

The authoritative record for every image is `src/content.json`, exported by the
builder as `research/images-manifest.json`. Each includes its file URL,
creator/institution credit, license link, original record, dimensions, catalog
date, limitations and any displayed cropping. Credits also appear beside the
images and in the viewer and image register.

The current file on an external host may change. Review the original record
again before public redistribution; retain dated copies of the rights evidence.
The image-download script creates a checksum manifest for the files retrieved.

No external fonts, icons, JavaScript libraries, CSS frameworks or commercial
image assets are bundled. Greek-letter typography and diagram shapes are not
representations of unphotographed coin types.

## Minting illustration

The three minting diagrams are original inline SVG schematics. Their process
explanation cites Michael Norris, *Greek Art: From Prehistoric to Classical*,
The Metropolitan Museum of Art (2000), “Origin and Technique,” printed p. 55
(PDF page 57). No artwork from that publication is reproduced or traced.
Tool shapes and engraved marks are schematic, not reconstructions of an actual
Athenian tool set or specimen. Silver is highlighted in gold for clarity.
The schematics belong to the site's implementation; they do not add or alter
any of the 17 photograph records or their individual rights conditions.

## Geographic overview

Section 01 uses public-domain Natural Earth data: 1:50m country outlines and
rivers, and 1:10m Greek administrative regions. Terms:
https://www.naturalearthdata.com/about/terms-of-use/ . The local derived outlines
are clipped, simplified and projected into inline SVG views. Region shading is
an editorial aid, not a reconstruction of ancient political boundaries or river
channels. Hatching explicitly marks broad regional locators; the Babylonia view
uses an approximate part of southern Iraq.

Dataset URLs, checksums, transformations, selection rules and geographic references
are recorded in `research/geography-explorer-findings.json`. The dependency-free
preprocessing script is `scripts/prepare-geography.py`; ordinary builds use the
committed derived data in `src/geography.json` without contacting a map provider.
No map tiles, external scripts, API keys or tracking services are loaded.
The earlier single-map source record remains in `research/geography-findings.json`
as research history.

## Editorial exclusions

An earlier candidate Pi-style image was excluded because its embedded
photographic copyright statement conflicted with the hosting-page rights label.
That exclusion is distinct from the six explicitly identified BnF additions,
whose separate Commons assertions and BnF reuse review are documented above.
Photographs of electrotype replicas and unrelated coin types were also excluded.
Remaining photographic gaps have not been filled with invented images.
The CNG Heterogeneous Group C lead is linked as a catalogue record only; the
low-resolution auction preview has not been embedded.

Publications are linked and paraphrased, not reproduced in full. Named museums,
researchers and photographers have not endorsed this independent project.
