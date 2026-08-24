/**
 * Renders the demo in a real browser and writes the images the README uses.
 *
 * Drives the Chrome already installed on the machine rather than downloading
 * one, so `puppeteer-core` stays a small devDependency. Point CHROME_PATH at a
 * different binary if the default is wrong.
 *
 *   npm run demo            # in one terminal
 *   npm run demo:capture    # in another
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import gifenc from "gifenc";
import puppeteer from "puppeteer-core";

const { GIFEncoder, applyPalette, quantize } = gifenc;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "media");
const URL = process.env.DEMO_URL ?? "http://localhost:5178/";
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 2 };

/**
 * Layout switcher labels, which are the Hebrew words the demo renders, and
 * where to park each layout so the shot shows what the layout is for: a spread
 * carrying a split greeting, a slide with a photo on it, and the grid's mosaic
 * rather than the cover that sits above it.
 */
const LAYOUTS = [
  { id: "book", label: "ספר", advance: 2, scroll: 0 },
  { id: "slider", label: "מצגת", advance: 4, scroll: 0 },
  { id: "grid", label: "רשת", advance: 0, scroll: 620 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, text) {
  const handle = await page.evaluateHandle((wanted) => {
    return [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === wanted,
    );
  }, text);
  const element = handle.asElement();
  if (!element) throw new Error(`no button labelled ${text}`);
  await element.click();
}

/**
 * The book renders its own labelled controls; the slider is driven by Swiper's
 * navigation module, which emits elements of its own. The grid shows
 * everything at once and has nothing to advance.
 */
async function advance(page) {
  const advanced = await page.evaluate(() => {
    const labelled = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === "הבא",
    );
    if (labelled) {
      labelled.click();
      return true;
    }
    const swiper = document.querySelector(".swiper-button-next");
    if (swiper) {
      swiper.click();
      return true;
    }
    return false;
  });
  if (!advanced) throw new Error("found no way to advance the album");
}

/** The engine's canvas, which is what the README should show — not the chrome. */
async function stageClip(page) {
  return page.$eval(".demo__stage", (el) => {
    const { x, y, width, height } = el.getBoundingClientRect();
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  /**
   * Headful by default. Headless composites only as often as it must, and the
   * screencast then catches a 700ms page turn in about six frames; a real
   * window paints at the display's rate and gives a usable one. Set
   * HEADLESS=1 for the stills, which do not care.
   */
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.HEADLESS === "1",
    args: ["--hide-scrollbars", "--disable-frame-rate-limit"],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60_000 });
  // Google Fonts land after load, and a screenshot taken before they do shows
  // the fallback face.
  await page.evaluate(() => document.fonts.ready);
  await sleep(1200);

  for (const layout of LAYOUTS) {
    await clickByText(page, layout.label);
    await sleep(1400);

    for (let i = 0; i < layout.advance; i += 1) {
      await advance(page);
      await sleep(1800);
      if (process.env.DEBUG_CAPTURE) {
        const c = await page.evaluate(
          () => document.querySelector(".ae-flip__counter")?.textContent ?? "-",
        );
        console.log(`  ${layout.id} advance ${i + 1} -> ${c}`);
      }
    }

    if (layout.scroll) {
      await page.evaluate((top) => {
        const scroller = [...document.querySelectorAll("*")].find(
          (el) => el.scrollHeight > el.clientHeight + 40,
        );
        (scroller ?? document.scrollingElement).scrollTo({ top });
      }, layout.scroll);
      await sleep(700);
    }

    const clip = await stageClip(page);
    const file = join(OUT, `${layout.id}.png`);
    // Without this the capture resizes the page to reach content outside the
    // viewport, the book re-measures, and the shot lands on a album that has
    // just snapped back to its first page.
    await page.screenshot({ path: file, clip, captureBeyondViewport: false });
    const counter = await page.evaluate(
      () => document.querySelector(".ae-flip__counter")?.textContent ?? "-",
    );
    console.log(`wrote ${file}  [counter ${counter}]`);
  }

  await captureTurn(page);

  await browser.close();
}

/**
 * One page turn, as a GIF.
 *
 * Taking this with `page.screenshot` in a loop does not work: a round trip
 * costs roughly half a second, so a turn that lasts under one would be caught
 * in about two frames. The screencast pushes frames from the compositor as they
 * are painted instead, which is the only way to get the animation at anything
 * like its real rate.
 */
async function captureTurn(page) {
  // Retina frames would quadruple the pixels for an image that gets scaled down
  // to sit in a README anyway.
  await page.setViewport({ ...VIEWPORT, deviceScaleFactor: 1 });
  await page.reload({ waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  // A window that is not frontmost has its rendering throttled, and the cast
  // then catches a handful of frames instead of a turn.
  await page.bringToFront();
  await sleep(1200);

  await advance(page);
  await sleep(1600);

  const clip = await stageClip(page);
  const client = await page.createCDPSession();

  let frames = [];
  client.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    frames.push({ data, timestamp: metadata.timestamp });
    try {
      await client.send("Page.screencastFrameAck", { sessionId });
    } catch {
      // The cast is stopped from under the last few acks; nothing to do.
    }
  });

  // Throttling is not entirely under this script's control, so a thin capture
  // is retried on the next turn rather than shipped as a stuttering GIF.
  const WANTED = 12;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    frames = [];
    await client.send("Page.startScreencast", {
      format: "png",
      everyNthFrame: 1,
    });
    await advance(page);
    await sleep(2200);
    await client.send("Page.stopScreencast");

    if (frames.length >= WANTED) break;
    console.log(
      `  attempt ${attempt}: ${frames.length} frame(s), retrying on the next turn`,
    );
    if (attempt === 4) {
      throw new Error(`screencast never exceeded ${frames.length} frames`);
    }
    await sleep(600);
  }

  // Real inter-frame gaps, so a turn that stalls on one frame reads as a stall
  // rather than being evened out.
  const delays = frames.map((frame, i) => {
    const next = frames[i + 1];
    const gap = next ? (next.timestamp - frame.timestamp) * 1000 : 900;
    return Math.min(1000, Math.max(20, Math.round(gap)));
  });

  const total = delays.reduce((sum, d) => sum + d, 0);
  console.log(`captured ${frames.length} frames over ${total}ms`);

  await encodeGif(page, frames, delays, clip);
}

const GIF_WIDTH = 640;

/**
 * Decoding PNGs needs a decoder, and the page already has one, so the frames go
 * back through the browser to become raw pixels — cropped to the album and
 * scaled down on the way, since a screencast frame is the whole viewport.
 */
async function encodeGif(page, frames, delays, clip) {
  const scale = GIF_WIDTH / clip.width;
  const width = GIF_WIDTH;
  const height = Math.round(clip.height * scale);

  const encoder = GIFEncoder();

  for (const [index, frame] of frames.entries()) {
    const pixels = await page.evaluate(
      async (base64, crop, w, h) => {
        const blob = await (
          await fetch(`data:image/png;base64,${base64}`)
        ).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(w, h);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          bitmap,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          w,
          h,
        );
        return [...ctx.getImageData(0, 0, w, h).data];
      },
      frame.data,
      clip,
      width,
      height,
    );

    const data = new Uint8ClampedArray(pixels);
    const palette = quantize(data, 128);
    const indexed = applyPalette(data, palette);
    encoder.writeFrame(indexed, width, height, {
      palette,
      delay: delays[index],
    });
    process.stdout.write(`\r  encoding frame ${index + 1}/${frames.length}`);
  }

  encoder.finish();
  const file = join(OUT, "page-turn.gif");
  writeFileSync(file, encoder.bytes());
  console.log(`\nwrote ${file} (${width}x${height})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
