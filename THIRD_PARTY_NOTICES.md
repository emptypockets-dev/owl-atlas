# Photographs and source material

The distribution references photographs; it does not contain their image bytes.
The optional archival script preserves credit/license fields without relicensing
any material. The website's software license does not cover these photographs.

## Image groups

**Cleveland Museum of Art / CC0 1.0**

- 1941.296.a and 1941.296.b, obverse/reverse. Gift of Dr. Jacob Hirsch.
- 1920.267.a and 1920.267.b, early classical obverse/reverse of the same coin
  (parent accession 1920.267). Gift of Harold W. Parsons. The museum's public
  records explicitly link both faces and designate them CC0.
- The early-classical reverse uses the museum's 750 × 717 web JPEG for page
  loading and its 2,384 × 2,280 print JPEG in the viewer. These museum-supplied
  files show the full source frame. The TIFF master remains available through
  the linked museum and Commons records. No local transformation was made.
- The Athena image from 1941.296.a uses a browser-compatible JPEG derivative of
  a TIFF source; it is not an invented or AI-enhanced version.

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
