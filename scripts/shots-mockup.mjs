import { chromium } from "playwright";
import { mkdirSync } from "fs";

// Ordem pedida: polaroid, revista (editorial), galeria (gallery), imersão (immersive).
const STYLES = ["polaroid", "editorial", "gallery", "immersive"];
const OUT = ".shots/styles-phone";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// 9:19 ~ frame do PhoneMockup; deviceScaleFactor 2 = retina pra marketing.
const ctx = await browser.newContext({ viewport: { width: 390, height: 823 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const s of STYLES) {
  await page.goto(`http://localhost:3000/dev/styles/${s}`, { waitUntil: "networkidle", timeout: 60000 });
  // esconde a barra dev de troca de estilo + o indicador dev do Next (não podem aparecer no print)
  await page.evaluate(() => {
    document.querySelectorAll('a[href^="/dev/styles"]').forEach((a) => {
      const bar = a.closest("div");
      if (bar) bar.style.display = "none";
    });
    document.querySelectorAll("nextjs-portal").forEach((e) => {
      e.style.display = "none";
    });
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}";
    document.head.appendChild(st);
  });
  await page.waitForTimeout(2500); // carrega imagens + transições de entrada
  await page.screenshot({ path: `${OUT}/${s}.png` });
  console.log("shot", s);
}

await browser.close();
console.log("done");
