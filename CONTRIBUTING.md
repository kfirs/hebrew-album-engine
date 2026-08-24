# Contributing

Thanks for taking an interest. This is a small, focused library, so the bar is
less "does it work" than "does it still belong here" — the notes below are
mostly about the second question.

## Getting set up

Node 20.19 or newer.

```bash
npm install
npm run demo        # http://localhost:5178
```

The demo in [`demo/`](demo) imports from `src/`, not from a build, so changes
appear on save. Use it as the place to try things: if a change cannot be seen
in the demo, it is worth asking whether the demo should cover it.

```bash
npm run build       # bundle + type declarations
npm run typecheck   # types only, no emit
```

## What belongs in this package

The engine takes configuration and returns DOM. That boundary is the reason it
can be published separately from the application it was extracted from, and it
is worth defending:

- **No data layer.** No database clients, no ORM types, no fetching. An album
  arrives as a plain `AlbumConfig` object.
- **No authentication, no authorisation, no routing, no environment variables.**
- **No sanitising.** `page.html` is rendered as markup, deliberately. Callers
  decide what is safe, on the server, on the way in — an allowlist applied in
  the browser protects nobody, because the request can be made without one.
  See the README section on `page.html`.
- **Right-to-left is the default, not a mode.** Every view sits inside an
  explicit `dir="rtl"` canvas. A change that only works when read left to right
  is a bug.

A feature that needs any of the above is usually a feature for the application
consuming this package.

## Right-to-left, in practice

Most of the subtle bugs in this codebase have been direction bugs, so:

- Use logical CSS properties — `inline-start`, `inline-end`, `margin-inline`,
  `padding-block` — rather than `left`, `right`, `margin-left`.
- The book layout is mirrored, which inverts the pointer arithmetic inside
  StPageFlip. That is why its own mouse and swipe handling is switched off and
  turns are driven from `PageFlipView` instead. If you touch navigation there,
  check the keyboard, the tap zones, the controls and a real touch swipe.
- Numbers read left to right even inside right-to-left text. The page counter
  sets `direction: ltr` for exactly this reason: without it "2 / 19" renders as
  "19 / 2".

Test in a browser, in Hebrew. The demo album is already in Hebrew.

## Style

- TypeScript throughout, `strict`. No `any` in exported signatures.
- Comments explain why, not what. If a line needs a comment to say what it
  does, rename something instead.
- Match the surrounding code rather than any particular style guide.

## Pull requests

- One concern per pull request.
- Describe what the change does for someone reading an album, not only what it
  does to the code.
- Include a screenshot or a short clip for anything visual.
  `npm run demo:capture` regenerates the README images if your change makes
  them wrong; it needs the demo running and drives the Chrome installed on your
  machine (`CHROME_PATH` overrides the location).
- Run `npm run build` before opening the PR. There is no CI gate yet, so the
  build is the check.

## Reporting a bug

Say what you expected the album to do, what it did, and which layout, browser
and viewport you saw it in. A cut-down `AlbumConfig` that reproduces it is
worth more than a description — the engine takes plain configuration, so a bug
report can be almost self-contained.
