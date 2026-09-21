# Font licences and provenance

Every font file in this directory is licensed under the **SIL Open Font License,
Version 1.1**. The verbatim licence text is reproduced once at the bottom of this
file; the per-family copyright lines and Reserved Font Names are recorded with
each family below.

These files were obtained on **2026-09-21** for the display-serif review at
`docs/font-samples/index.html`. Nothing here is wired into the built site yet.

| Family | Styles | Files | Bytes | Greek |
| --- | --- | --- | ---: | --- |
| Instrument Serif | Regular 400, Italic 400 | 4 | 46,996 | no |
| Fraunces | variable 100–900, upright + italic | 4 | 505,888 | no |
| GFS Didot | Regular 400, Italic 400, Bold 700 | 5 | 124,052 | **yes** |
| **Total** | | **13** | **676,936** | |

---

## Instrument Serif

- **Source:** Google Fonts CSS API v2 —
  `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap`
  (requested with a desktop Chrome `User-Agent` so the API returns woff2 URLs
  with `unicode-range` subsets), resolving to
  `https://fonts.gstatic.com/s/instrumentserif/v5/…`
- **Upstream project:** <https://github.com/Instrument/instrument-serif>
- **Google Fonts revision:** v5
- **Font version string:** `Version 1.000; ttfautohint (v1.8.4.7-5d5b);gftools[0.9.27]`
- **Copyright:** Copyright 2022 The Instrument Serif Project Authors
  (https://github.com/Instrument/instrument-serif)
- **Reserved Font Name:** none declared
- **Licence:** OFL 1.1 — <https://scripts.sil.org/OFL>

| File | Subset | Style | Bytes |
| --- | --- | --- | ---: |
| `instrument-serif/instrument-serif-latin-400-normal.woff2` | latin | 400 upright | 15,040 |
| `instrument-serif/instrument-serif-latin-ext-400-normal.woff2` | latin-ext | 400 upright | 7,828 |
| `instrument-serif/instrument-serif-latin-400-italic.woff2` | latin | 400 italic | 15,684 |
| `instrument-serif/instrument-serif-latin-ext-400-italic.woff2` | latin-ext | 400 italic | 8,444 |

Only two styles exist — there is no bold and no variable axis. Greek is absent
from the family entirely; the API offers no `greek` subset.

---

## Fraunces

- **Source:** Google Fonts CSS API v2 —
  `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1&display=swap`,
  resolving to `https://fonts.gstatic.com/s/fraunces/v38/…`
- **Upstream project:** <https://github.com/undercasetype/Fraunces>
- **Google Fonts revision:** v38
- **Font version string:** `Version 1.000;[b76b70a41]`
- **Copyright:** Copyright 2018 The Fraunces Project Authors
  (https://github.com/undercasetype/Fraunces)
- **Reserved Font Name:** none declared
- **Licence:** OFL 1.1 — <https://scripts.sil.org/OFL>

| File | Subset | Style | Bytes |
| --- | --- | --- | ---: |
| `fraunces/fraunces-latin-var-normal.woff2` | latin | variable upright | 120,800 |
| `fraunces/fraunces-latin-ext-var-normal.woff2` | latin-ext | variable upright | 105,476 |
| `fraunces/fraunces-latin-var-italic.woff2` | latin | variable italic | 149,512 |
| `fraunces/fraunces-latin-ext-var-italic.woff2` | latin-ext | variable italic | 130,100 |

**Axes confirmed present in the downloaded files** (read back from `fvar`):

| Axis | Range | Default |
| --- | --- | --- |
| `opsz` | 9 – 144 | 9 |
| `wght` | 100 – 900 | 900 |
| `SOFT` | 0 – 100 | 0 |
| `WONK` | 0 – 1 | 1 |

Note the `wght` default is **900**, so any rule that sets
`font-variation-settings` must name `"wght"` explicitly or the text renders Black.

### Static alternative

The variable pair is heavy: 264 KB for latin upright + italic, 494 KB with the
latin-ext subsets. Pinning the instance the sample page defaults to —
`opsz 144, wght 400, SOFT 0, WONK 1` — produces, from these same files:

| Instance | Bytes |
| --- | ---: |
| Fraunces 144pt Regular (latin) | 17,180 |
| Fraunces 144pt Italic (latin) | 21,904 |

That is a ~93% saving. The pinned files are **not** committed here — they were
measured with `fontTools.varLib.instancer` and are trivial to regenerate if the
axes turn out to be a tuning tool rather than a shipped feature. Google Fonts
also publishes equivalent statics under
<https://github.com/google/fonts/tree/main/ofl/fraunces>.

---

## GFS Didot

Two sources, because Google Fonts carries **only the Regular**
(`https://api.github.com/repos/google/fonts/contents/ofl/gfsdidot` lists a single
`GFSDidot-Regular.ttf`, and `css2?family=GFS+Didot:ital@1` / `:wght@700` both
404). The Italic and Bold come from the Greek Font Society's own OFL release.

- **Regular source:** Google Fonts CSS API v2 —
  `https://fonts.googleapis.com/css2?family=GFS+Didot:wght@400&display=swap`,
  resolving to `https://fonts.gstatic.com/s/gfsdidot/v18/…`
  — Google Fonts revision **v18**
- **Italic + Bold source:** <https://greekfontsociety-gfs.gr/_assets/fonts/GFS_Didot.zip>
  (1,220,326 bytes, last modified 2022-06-29), files `GFSDidotItalic.otf` and
  `GFSDidotBold.otf`
- **Upstream:** Greek Font Society — <https://greekfontsociety-gfs.gr>
- **Font version string:** `Version 1.0` (all styles)
- **Copyright:** Copyright (c) Takis Katsoulidis and George D. Matthiopoulos,
  2001. All rights reserved. / This Font Software is Copyright (c) 1995–2006,
  Greek Font Society (http://www.greekfontsociety.org).
- **Reserved Font Name:** **"GFS Didot"**
- **Licence:** OFL 1.1 — <http://scripts.sil.org/OFL>

| File | Coverage | Style | Bytes | Origin |
| --- | --- | --- | ---: | --- |
| `gfs-didot/gfs-didot-latin-400-normal.woff2` | latin | 400 upright | 14,508 | Google Fonts v18 |
| `gfs-didot/gfs-didot-greek-400-normal.woff2` | greek | 400 upright | 7,220 | Google Fonts v18 |
| `gfs-didot/gfs-didot-greek-ext-400-normal.woff2` | greek-ext | 400 upright | 8,964 | Google Fonts v18 |
| `gfs-didot/gfs-didot-400-italic.woff2` | latin + greek + greek-ext | 400 italic | 48,096 | GFS release, converted |
| `gfs-didot/gfs-didot-700-normal.woff2` | latin + greek + greek-ext | 700 upright | 45,264 | GFS release, converted |

### What was done to the Italic and Bold

The two OTFs were subset to the union of the Google Fonts `latin`, `greek` and
`greek-ext` unicode ranges and re-flavoured as woff2 with `fontTools` 4.60.2 —
`Subsetter` with `layout_features=['*']` and `name_IDs=['*']`, then
`font.flavor = 'woff2'`. Outlines, metrics, hinting and the name table are
untouched; only unreferenced glyphs were dropped and the container changed.
The Italic keeps 583 of 948 glyphs (90 Greek codepoints, Θ present) and the Bold
578 of 949 (84 Greek codepoints, Θ present).

**On the Reserved Font Name.** OFL 1.1 §3 forbids a *Modified Version* from using
the Reserved Font Name. Subsetting and format conversion without touching the
design is the same operation Google Fonts performs on the Regular while keeping
the family name, and SIL's OFL-FAQ treats it as acceptable. If the site ever
ships these two files and you want to be maximally conservative, rename the
internal family (e.g. "Owl Atlas Didot") before shipping, or contact the Greek
Font Society. Nothing here is on the live site today.

---

## SIL Open Font License, Version 1.1

Verbatim copy, as required by the licence. It applies to Instrument Serif,
Fraunces and GFS Didot alike; see each family above for its copyright line and
Reserved Font Name.

```
-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```
