// Gera public/preview-placeholder.png a partir de scripts/placeholder-photo.html.
// Uso: node scripts/gen-placeholder.mjs
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = pathToFileURL(path.join(root, "scripts", "placeholder-photo.html")).href;
const out  = path.join(root, "public", "preview-placeholder.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(html, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800); // garante fonte Caveat carregada
await page.screenshot({ path: out });
await browser.close();
console.log("ok:", out);
