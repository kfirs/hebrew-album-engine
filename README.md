# @album-engine/core

RTL-first React rendering engine for digital congratulatory albums.

Configuration JSON in, active React DOM out. The package has no dependency on
any database, authentication strategy or hosting platform — it is generic,
functional and layout-driven, and every view is anchored inside an explicit
right-to-left canvas so Hebrew renders without layout shifts or reversed
alignments.

## Install

```bash
npm install @album-engine/core
```

`react` and `react-dom` (18 or newer) are peer dependencies.

## Usage

```tsx
import { AlbumEngine, type AlbumConfig } from "@album-engine/core";
import "@album-engine/core/styles.css";

const album: AlbumConfig = {
  id: "demo",
  title: "יום הולדת שמח",
  layoutType: "PAGE_FLIP",
  themeColor: "#fdf6ee",
  globalBackground: "linear-gradient(165deg, #fdf6ee 0%, #f3e8ff 100%)",
  autoplayEnabled: true,
  autoplaySpeed: 6000,
  loopPresentation: true,
  coverStyle: "FLORAL_FRAME",
  coverSubtitle: "אלבום ברכות",
  coverTextColor: "#7c2d5a",
  pages: [
    {
      id: "p1",
      order: 0,
      text: "מזל טוב! שתמיד תמשיכי להאיר.",
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

## `AlbumEngine` props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `albumData` | `AlbumConfig` | — | Album configuration including its pages |
| `presentationMode` | `boolean` | `albumData.autoplayEnabled` | Overrides the album's autoplay flag |
| `viewVariant` | `"public-minimal" \| "dashboard-preview" \| "full"` | `"full"` | Chrome density preset |
| `showBackCover` | `boolean` | `true` | Appends a derived closing cover |
| `showControls` | `boolean` | `true` | Set to `false` for kiosk playback |
| `onPageChange` | `(index: number) => void` | — | Fired when the active slide changes |
| `className` | `string` | — | Added to the RTL canvas |

## Layouts

- `PAGE_FLIP` — a real page-turning book via StPageFlip, mirrored so it opens
  from the right. Autoplay is driven by an interval against the instance API.
- `SLIDER` — a Swiper carousel; autoplay uses Swiper's own Autoplay module.
- `GRID` — a responsive mosaic of every greeting, bracketed by the covers.
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
