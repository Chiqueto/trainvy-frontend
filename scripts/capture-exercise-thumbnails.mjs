import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const [baseUrl, ...selections] = process.argv.slice(2);
if (!baseUrl || !selections.length) {
  throw new Error(
    "Usage: node scripts/capture-exercise-thumbnails.mjs http://localhost:3000 animation[=phase] ...",
  );
}
const url = new URL("/lab/exercises-3d", baseUrl);
const output = resolve("scripts/assets/exercise-thumbnails");
const viewports = {
  desktop: { width: 960, height: 900 },
  mobile: { width: 390, height: 844 },
};

const reviewDir = process.env.TRAINVY_THUMBNAIL_REVIEW_DIR;
const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--enable-webgl",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  await mkdir(output, { recursive: true });
  if (reviewDir) await mkdir(reviewDir, { recursive: true });
  const page = await browser.newPage({
    viewport: viewports.desktop,
    reducedMotion: "reduce",
    storageState: process.env.TRAINVY_THUMBNAIL_STORAGE_STATE,
  });
  await page.goto(url.href, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });

  const slider = page.locator('section input[type="range"]').first();
  await slider.waitFor({ timeout: 120_000 });

  for (const selection of selections) {
    const [key, value = "0.5"] = selection.split("=");
    const phase = Number(value);
    if (
      !/^[a-z][a-z0-9-]*$/.test(key) ||
      !Number.isFinite(phase) ||
      phase < 0 ||
      phase >= 1
    ) {
      throw new Error("Invalid animation or phase: " + selection);
    }
    await page.setViewportSize(viewports.desktop);
    const button = '[data-exercise-animation="' + key + '"]';
    await page.locator(button).click();
    await page.locator(button + '[aria-pressed="true"]').waitFor();

    await slider.fill(String(Math.round(phase * 1000)), { timeout: 60_000 });
    const viewer = slider.locator("xpath=ancestor::section[1]");
    const canvas = viewer.locator("canvas");
    const overlay =
      "[data-pose-revision] > div.pointer-events-none, [data-pose-revision] > button";
    async function capture() {
      await canvas.evaluate(
        () =>
          new Promise((done) => {
            requestAnimationFrame(() => requestAnimationFrame(done));
          }),
      );
      return canvas.screenshot({
        style: overlay + " { visibility: hidden !important; }",
      });
    }
    const frame = await capture();
    const { width, height } = await sharp(frame).metadata();
    const side = Math.min(width, height);
    await sharp(frame)
      .extract({
        left: Math.floor((width - side) / 2),
        top: Math.floor((height - side) / 2),
        width: side,
        height: side,
      })
      .resize(288, 288)
      .webp({ quality: 90 })
      .toFile(resolve(output, key + ".webp"));
    if (reviewDir) {
      await sharp(frame)
        .png()
        .toFile(resolve(reviewDir, key + "-desktop.png"));
      await page.setViewportSize(viewports.mobile);
      await viewer
        .getByRole("button", { name: "Lateral", exact: true })
        .click();
      for (const [label, position] of [
        ["top", "0"],
        ["bottom", "500"],
      ]) {
        await slider.fill(position);
        await sharp(await capture())
          .png()
          .toFile(resolve(reviewDir, key + "-mobile-" + label + ".png"));
      }
    }
    console.log(key + ".webp");
  }
} finally {
  await browser.close();
}
