import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = ".shots/landing";
mkdirSync(OUT, { recursive: true });

const URL = "http://localhost:3000/";

// Seções na ordem em que aparecem. Captura cada elemento isolado.
const SECTIONS = [
  { name: "navbar",      sel: "header, nav" },
  { name: "hero",        sel: "main > *:nth-child(1)" },
  { name: "howitworks",  sel: "main > *:nth-child(2)" },
  { name: "pricing",     sel: "#planos" },
  { name: "faq",         sel: "main > *:nth-child(4)" },
  { name: "finalcta",    sel: "main > *:nth-child(5)" },
  { name: "footer",      sel: "footer" },
];

async function capture(label, viewport) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

  // rola pra disparar IntersectionObserver / animações de entrada
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  // full page
  await page.screenshot({ path: `${OUT}/${label}-full.png`, fullPage: true });

  // por seção
  for (const s of SECTIONS) {
    const el = await page.$(s.sel);
    if (!el) { console.log(`  [skip] ${label} ${s.name} (sel ${s.sel} não achou)`); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await el.screenshot({ path: `${OUT}/${label}-${s.name}.png` });
    console.log(`  shot ${label} ${s.name}`);
  }

  await browser.close();
}

await capture("desktop", { width: 1440, height: 900 });
await capture("mobile",  { width: 390,  height: 844 });
console.log("done");
