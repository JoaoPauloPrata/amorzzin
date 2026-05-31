import { chromium } from "playwright";
import { mkdirSync } from "fs";

const STYLES = ["immersive", "polaroid", "editorial", "gallery"];
const OUT = ".shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const s of STYLES) {
  await page.goto(`http://localhost:3000/dev/styles/${s}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500); // imagens picsum + transições
  await page.screenshot({ path: `${OUT}/${s}-hero.png` });          // dobra (viewport)

  // rola em passos pra disparar os IntersectionObserver (Reveal)
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${s}-full.png`, fullPage: true });
  console.log(`shot ${s}`);
}

await browser.close();
console.log("done");
