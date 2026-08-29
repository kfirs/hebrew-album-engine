# @sassoninc/album-engine-core

RTL-first React rendering engine for digital congratulatory albums.

[![npm](https://img.shields.io/npm/v/@sassoninc/album-engine-core.svg)](https://www.npmjs.com/package/@sassoninc/album-engine-core)
[![npm downloads](https://img.shields.io/npm/dm/@sassoninc/album-engine-core.svg)](https://www.npmjs.com/package/@sassoninc/album-engine-core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@sassoninc/album-engine-core)](https://bundlephobia.com/package/@sassoninc/album-engine-core)
[![licence](https://img.shields.io/npm/l/@sassoninc/album-engine-core.svg)](./LICENSE)
[![types](https://img.shields.io/npm/types/@sassoninc/album-engine-core.svg)](./src/types.ts)

Configuration JSON in, active React DOM out. The package has no dependency on
any database, authentication strategy or hosting platform — it is generic,
functional and layout-driven, and every view is anchored inside an explicit
right-to-left canvas so Hebrew renders without layout shifts or reversed
alignments.

<p align="center">
  <img
    src="https://raw.githubusercontent.com/kfirs/hebrew-album-engine/main/docs/media/page-turn.gif"
    alt="A Hebrew album turning a page, opening from the right"
    width="640"
  />
</p>

A book that opens from the right and turns the way a Hebrew reader expects,
with a greeting's photo and words kept on the same spread.

## The three layouts

| Book (`PAGE_FLIP`) | Slider (`SLIDER`) | Grid (`GRID`) |
| --- | --- | --- |
| [<img src="https://raw.githubusercontent.com/kfirs/hebrew-album-engine/main/docs/media/book.png" alt="Two facing pages: a photo on the left, a wish and its signature on the right" width="260">](docs/media/book.png) | [<img src="https://raw.githubusercontent.com/kfirs/hebrew-album-engine/main/docs/media/slider.png" alt="A single greeting on a slide, with a right-aligned bulleted list" width="260">](docs/media/slider.png) | [<img src="https://raw.githubusercontent.com/kfirs/hebrew-album-engine/main/docs/media/grid.png" alt="A mosaic of greeting cards, some with photos" width="260">](docs/media/grid.png) |

Everything above is the [demo](#running-the-demo) in this repository, with
invented greetings and drawn-in stand-ins for the photographs.

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
      html: "<p>מזל טוב! <strong>שתמיד</strong> תמשיכי להאיר.</p>",
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

If greetings can come from anyone but the album's owner — a public "add your
wish" form, say — sanitise them **on the server, on the way in**, with something
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

## Photos, collages and video

A page's picture can be a single `imageUrl`, several photos (`photoUrls`, laid
out as an auto-collage that keeps a lone trailing photo spanning its row), or a
`videoUrl`, which takes the media slot on its own. Printing a video greeting
yields the poster frame with the player controls suppressed, since paper cannot
honour them.

A greeting with text *and* any of those is rendered as two slides rather than
one crowded page — the words first, then the media, with the signature staying
with the words. In the book layout, when the viewport is wide enough to show
two leaves at once, a blank leaf is inserted where needed so a split pair always
lands on the same spread instead of straddling a turn.

## `AlbumEngine` props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `albumData` | `AlbumConfig` | — | Album configuration including its pages |
| `presentationMode` | `boolean` | `albumData.autoplayEnabled` | Overrides the album's autoplay flag |
| `viewVariant` | `"public-minimal" \| "dashboard-preview" \| "full"` | `"full"` | Chrome density preset |
| `showBackCover` | `boolean` | `true` | Appends a derived closing cover |
| `showControls` | `boolean` | `true` | Set to `false` to hide the navigation chrome |
| `kiosk` | `boolean` | `false` | Unattended playback: never pauses itself (see below) |
| `onPageChange` | `(index: number) => void` | — | Fired when the active slide changes |
| `onControllerReady` | `(c: AlbumNavController) => void` | — | Hands back a `gotoSlide`/`step` handle for driving the album from outside |
| `className` | `string` | — | Added to the RTL canvas |

## Layouts

- `PAGE_FLIP` — a real page-turning book via StPageFlip, mirrored so it opens
  from the right. Autoplay is driven by an interval against the instance API.
  Because the mirror inverts the library's own pointer maths, turns are handled
  here instead: tap zones, the arrow keys, the controls, and a swipe on touch
  (rightwards to advance, as though pulling the left leaf across the spine).
  Resizing keeps the reader where they were, including across the width at
  which the book stops showing two leaves and has to be rebuilt.
- `SLIDER` — a Swiper carousel; autoplay uses Swiper's own Autoplay module.
- `GRID` — a responsive mosaic of every greeting, bracketed by the covers.
  Presentation flags do not apply.

## Kiosk playback

Both animated layouts stop themselves when a reader takes over — Swiper pauses
under a hovering cursor and after a swipe, and the book stops its ticker when a
page is turned by hand. That is right for somebody reading, and wrong for a
projector at an event: the laptop driving it has a cursor lying somewhere over
the image, and one nudge of the trackpad leaves the room looking at a single
greeting for the rest of the evening.

`kiosk` turns those courtesies off. Pages still turn by hand — a passer-by can
skip ahead — but the presentation always resumes, and nothing an idle pointer
does stops it. Pair it with `showControls={false}`, and with
`loopPresentation` so the album does not settle on its back cover.

## Cover templates

`MINIMAL`, `VINTAGE`, `MODERN_BORDER`, `FLORAL_FRAME`, `PHOTO_FULL`,
`GOLD_FOIL`, `HERITAGE_GOLD` and `ALBUM_CORNERS`. The cover wrapper intercepts
index zero and renders the selected template instead of a normal body slot;
`FLORAL_FRAME` flanks the title with two mirrored SVG vine borders.

Every template except `PHOTO_FULL` — which has a hero photo to bleed and a page
has nothing to bleed — can also dress the greeting pages, either by setting
`pageStyle` or by setting `syncPageStyleWithCover` so the whole album reads as
one bound object.

A single page can also carry its own `pageStyle`, which outranks both. That is
for the greeting that wants to stand apart — the grandmother's page in gold
foil in an album that is otherwise plain — and not for dressing each page
differently, which reads as a mistake rather than a choice.

## The word cloud page

Set `showWordCloud` and the album gains a closing page built from the words its
greetings actually used, sized by how often each one appears.

```ts
const album: AlbumConfig = {
  // …
  showWordCloud: true,
  wordCloudTitle: "המילים שלכם", // optional; this is the default
};
```

It is a slide like any other, so it flows in the book, the carousel and the
grid, and prints with the rest. Counting ignores the function words that would
otherwise win every time — Hebrew's and English's both — and strips niqqud, so
the same word written with and without vowel points is counted once. Hebrew
glues its prepositions onto the word that follows, and separating them properly
needs a morphological analyser, so `בבית` and `בית` are counted as the two
different words they appear to be.

Sizing is logarithmic against the rarest word shown and tops out at four times
as common, which keeps an album with two greetings in it from printing two
words enormous and everything else as fine print. The order is a hash of the
words themselves rather than their frequency: it scatters the large words
through the small, and it is the same order on the server, in the browser and
on paper.

`buildWordCloud(album)` is exported if you would rather draw the cloud
yourself; it returns each word with its count and a `weight` from 0 to 1.

## Reading on a phone

Photographs open full-screen when tapped, since a print sharing a page with a
greeting is too small to make out faces in. Pinching magnifies the page itself,
and while the reader is zoomed in a one-finger drag pans rather than turning
the leaf out from under them.

## Printing and PDF

`PrintBook` lays an album onto fixed sheets so a browser can paginate it, which
the interactive layouts cannot be — they size themselves to the window. Export
is then whatever the browser's print dialog offers, including *Save as PDF*.

```tsx
import { PrintBook } from "@sassoninc/album-engine-core";
import "@sassoninc/album-engine-core/styles.css";
import "@sassoninc/album-engine-core/print.css";

<PrintBook album={album} />;
```

The stylesheet is a **separate entry point on purpose**: it carries an `@page`
rule, and page size is a document-level declaration, so importing it globally
would make every page in the host application print as A4 landscape. Import it
only on the route that prints an album.

Sheets are paginated the way the book is: the front cover opens alone, then
every sheet is an open spread of two leaves, complete with the same spacer
logic, so a greeting split into words and photo is never dealt across two
sheets. A reader who knows the digital album recognises the printed one.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `album` | `AlbumConfig` | — | Album configuration including its pages |
| `showBackCover` | `boolean` | `true` | Appends the closing cover, as the book does |
| `pageNumbers` | `boolean` | `true` | Numbers the leaves along the foot |
| `className` | `string` | — | Added to the RTL canvas |

Sheet size and the themed border around the book are custom properties, so
another stock is a stylesheet override rather than a fork:

```css
.ae-print {
  --ae-sheet-w: 279mm; /* US Letter, landscape */
  --ae-sheet-h: 216mm;
  --ae-sheet-margin: 12mm;
}
```

Change `@page size` to match if you do.

## Exports

Besides `AlbumEngine`, the individual building blocks are exported for custom
compositions: `RTLCanvas`, `BackgroundOrchestrator`, `GreetingPage`,
`BlankPage`, `CoverWrapper`, `WordCloudPage`, `PageFlipView`, `SliderView`,
`GridView`, `PrintBook`, the `useAutoplay` hook, and the `backgroundStyle`,
`buildSlides`, `buildWordCloud`, `pairSplitGreetings`, `paginate` and
`resolvePageStyle` helpers, along with all types.

`SlideSurface` turns one slide into its surface and is what every layout and
the printed sheet render through, so a composition built on it picks up new
kinds of slide rather than having to learn each one.

## Running the demo

```bash
npm install
npm run demo        # http://localhost:5178
```

The demo in [`demo/`](demo) runs against `src/`, so a change shows up without a
build step. It is also what produces the images above:

```bash
npm run demo:capture   # with the demo already running
```

## Contributing

Bug reports and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT
