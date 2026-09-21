# The close reading that preceded "Anatomy of an Owl"

Extracted unchanged from the commit before the Anatomy prototype (`10a5b2d^`,
16–20 September 2026) when the Anatomy exhibit was removed on 21 September 2026.
It was the "interactive close reading": a native radio toggle between the
owl/reverse and Athena/obverse, each face with detail buttons, a numbered marker
on the photograph, and a sourced explanation; all six readings rendered at build
time for reading without JavaScript.

- `content-anatomy.json`: the six readings with their citations.
- `render-anatomy.mjs`: the build-time markup function.
- `page-section.html`: the section wrapper that held the `{{ANATOMY}}` token.
- `app-anatomy.js`: the enhancement script.
- `styles-anatomy.css`: the rules that styled it.

Kept as research history. Restoring it would need the citations re-checked
against the current bibliography numbering and the current image derivatives.
