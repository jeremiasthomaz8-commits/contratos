import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    !/Failed to load resource.*(401|403)/.test(message.text())
  )
    errors.push(message.text());
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1300);
await mkdir("test-results", { recursive: true });
await page.screenshot({ path: "test-results/desktop.png" });
assert.equal(await page.locator("[data-clause]").count(), 11);
await page.getByRole("link", { name: "Explorar contrato" }).click();
await page.waitForTimeout(800);
assert.ok(
  await page
    .locator("#parceria")
    .evaluate((e) => Math.abs(e.getBoundingClientRect().top) < 120),
);
await page.getByRole("link", { name: "Ler contrato completo" }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: "test-results/contract.png" });
await page
  .getByRole("button", { name: "Assinar como contratante", exact: true })
  .click();
await page.getByRole("dialog").waitFor();
await page.getByRole("button", { name: "Entendi", exact: true }).click();
const axe = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  .analyze();
const violations = axe.violations.map((v) => ({
  id: v.id,
  impact: v.impact,
  description: v.description,
  nodes: v.nodes.map((n) => n.target),
}));
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1100);
await page.screenshot({ path: "test-results/mobile.png" });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.setViewportSize({ width: 320, height: 700 });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.getByRole("button", { name: "Abrir navegação" }).click();
await page.getByRole("link", { name: "O contrato", exact: true }).click();
await page.waitForTimeout(800);
assert.equal(await page.locator(".mobile-clauses").isVisible(), true);
await page.goto("http://localhost:3000/assinar", { waitUntil: "networkidle" });
assert.ok(
  await page
    .getByText("Abra o convite individual recebido por e-mail", {
      exact: false,
    })
    .isVisible(),
);
await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
assert.ok(
  await page.getByRole("button", { name: "Entrar com segurança" }).isVisible(),
);
const denied = await page.request.get("http://localhost:3000/api/admin");
assert.equal(denied.status(), 401);
const privateFile = await page.request.get(
  "http://localhost:3000/api/document",
);
assert.equal(privateFile.status(), 401);
const csrf = await page.request.post("http://localhost:3000/api/sign/confirm", {
  headers: { Origin: "https://outro.example" },
  data: { consent: true, hash: "a".repeat(64) },
});
assert.equal(csrf.status(), 403);
const noFakeSign = await page.request.post(
  "http://localhost:3000/api/sign/confirm",
  {
    headers: { Origin: "http://localhost:3000" },
    data: { consent: true, hash: "a".repeat(64) },
  },
);
assert.equal(noFakeSign.status(), 401);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://localhost:3000");
assert.equal(
  await page
    .locator(".hero-light")
    .evaluate((el) => getComputedStyle(el).animationName),
  "none",
);
await writeFile(
  "test-results/browser.json",
  JSON.stringify(
    {
      errors,
      violations,
      checks:
        "desktop, 390px, 320px, navigation, invitation dialog, no-token, admin auth, private document, CSRF, reduced motion",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ errors, violations }, null, 2));
await browser.close();
assert.equal(errors.length, 0);
assert.equal(violations.length, 0);
