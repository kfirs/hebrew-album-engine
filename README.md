# @sassoninc/album-engine-core

RTL-first React rendering engine for digital congratulatory albums.

Configuration JSON in, active React DOM out. The package has no dependency on
any database, authentication strategy or hosting platform â€” it is generic,
functional and layout-driven, and every view is anchored inside an explicit
right-to-left canvas so Hebrew renders without layout shifts or reversed
alignments.

## Install

```bash
npm install @sassoninc/album-engine-core
```

`react` and `react-dom` (18 or newer) are peer dependencies.

## Usage

```tsx
import { AlbumEngine, type AlbumConfig } from "@sassoninc/album-engine-core";
import "@sassoninc/album-engine-core/styles.css";

const album: AlbumConfig = {
  id: "demo",
  title: "×™×•× ×”×•×œ×“×ª ×©×ž×—",
  layoutType: "PAGE_FLIP",
  themeColor: "#fdf6ee",
  globalBackground: "linear-gradient(165deg, #fdf6ee 0%, #f3e8ff 100%)",
  autoplayEnabled: true,
  autoplaySpeed: 6000,
  loopPresentation: true,
  coverStyle: "FLORAL_FRAME",
  coverSubtitle: "××œ×‘×•× ×‘×¨×›×•×ª",
  coverTextColor: "#7c2d5a",
  pages: [
    {
      id: "p1",
      order: 0,
      html: "<p>×ž×–×œ ×˜×•×‘! <strong>×©×ª×ž×™×“</strong> ×ª×ž×©×™×›×™ ×œ×”××™×¨.</p>",
      fontFamily: "Rubik",
      fontSize: "22px",
      textColor: "#1E3A8A",
      textAlign: "right",
    },
  ],
};

export function Album() {
  return <AlbumEngine albumData={album} viewVariant="public-minimal" />;
}
```

Load the Hebrew families you reference in `fontFamily` yourself (for example via
Google Fonts); the engine only applies the family name.

## `page.html` is rendered as markup

A greeting is HTML, and the engine renders it without escaping. It is a
rendering library and does no sanitising of its own: whatever puts a value in
`html` is responsible for it being safe.

If greetings can come from anyone but the album's owner â€” a public "add your
wish" form, say â€” sanitise them **on the server, on the way in**, with something
like [`sanitize-html`](https://www.npmjs.com/package/sanitize-html). An
allowlist enforced in the browser protects nobody, because the request can be
made without the browser.

The tags the engine styles, and a reasonable allowlist to start from, are `p`,
`br`, `strong`, `b`, `em`, `i`, `u`, `s`, `ul`, `ol`, `li` and `span`, with
`style` limited to `color`, `font-size` and `text-align`.

## Typography and inheritance

`fontFamily`, `fontSize`, `textColor` and `textAlign` are all nullable on a
page. Leave one out and the page falls back to the album's matching
`default*` field, which is what lets an album-wide change reach greetings that
were written before it. Set one and it wins for that page alone.

## Pages that carry both a wish and a photo

A greeting with text *and* an `imageUrl` is rendered as two slides rather than
one crowded page â€” the words first, then the photo, with the signature staying
with the words. In the book layout, when the viewport is wide enough to show
two leaves at once, a blank leaf is inserted where needed so a split pair always
lands on the same spread instead of straddling a turn.

## `AlbumEngine` props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `albumData` | `AlbumConfig` | â€” | Album configuration including its pages |
| `presentationMode` | `boolean` | `albumData.autoplayEnabled` | Overrides the album's autoplay flag |
| `viewVariant` | `"public-minimal" \| "dashboard-preview" \| "full"` | `"full"` | Chrome density preset |
| `showBackCover` | `boolean` | `true` | Appends a derived closing cover |
| `showControls` | `boolean` | `true` | Set to `false` for kiosk playback |
| `onPageChange` | `(index: number) => void` | â€” | Fired when the active slide changes |
| `className` | `string` | â€” | Added to the RTL canvas |

## Layouts

- `PAGE_FLIP` â€” a real page-turning book via StPageFlip, mirrored so it opens
  from the right. Autoplay is driven by an interval against the instance API.
  Because the mirror inverts the library's own pointer maths, turns are handled
  here instead: tap zones, the arrow keys, the controls, and a swipe on touch
  (rightwards to advance, as though pulling the left leaf across the spine).
- `SLIDER` â€” a Swiper carousel; autoplay uses Swiper's own Autoplay module.
- `GRID` â€” a responsive mosaic of every greeting, bracketed by the covers.
  Presentation flags do not apply.

## Cover templates

`MINIMAL`, `VINTAGE`, `MODERN_BORDER` and `FLORAL_FRAME`. The cover wrapper
intercepts index zero and renders the selected template instead of a normal body
slot; `FLORAL_FRAME` flanks the title with two mirrored SVG vine borders.

## Exports

Besides `AlbumEngine`, the individual building blocks are exported for custom
compositions: `RTLCanvas`, `BackgroundOrchestrator`, `GreetingPage`,
`CoverWrapper`, `PageFlipView`, `SliderView`, `GridView`, the `useAutoplay` hook
and the `backgroundStyle` helper, along with all types.

## Licence

MIT
