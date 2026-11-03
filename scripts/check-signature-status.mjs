import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  let state = {
    status: "awaiting",
    released: true,
    contratante: false,
    contratado: false,
  };
  let failed = false;
  await page.route("**/api/signature-status", (route) =>
    route.fulfill({
      status: failed ? 503 : 200,
      json: failed ? { error: "Indisponível" } : state,
    }),
  );
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page
    .getByText("Aguardando as duas assinaturas", { exact: true })
    .waitFor();
  state = { ...state, status: "partial", contratante: true };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByText("Contrato parcialmente assinado — aguardando a outra parte", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator(".signer-card button:disabled").count(), 1);
  await page
    .locator("#assinaturas")
    .screenshot({ path: "test-results/signature-partial.png" });
  state = { ...state, status: "signed", contratado: true };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByText("Contrato assinado por ambas as partes", { exact: true })
    .waitFor();
  assert.equal(await page.locator(".signer-card button:disabled").count(), 2);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page
    .locator("#assinaturas")
    .screenshot({ path: "test-results/signature-complete-mobile.png" });
  failed = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByText(
      "Não foi possível atualizar as assinaturas. Tentaremos novamente automaticamente.",
      { exact: true },
    )
    .waitFor();
  failed = false;
  state = {
    status: "awaiting",
    released: true,
    contratante: false,
    contratado: false,
  };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByText("Aguardando as duas assinaturas", { exact: true })
    .waitFor();
  assert.equal(await page.locator(".signer-card button:disabled").count(), 0);
  const response = await fetch("http://127.0.0.1:3000/api/signature-status");
  assert.equal(response.status, 200);
  const real = await response.json();
  assert.deepEqual(Object.keys(real).sort(), [
    "contratado",
    "contratante",
    "released",
    "status",
  ]);
  console.log(
    JSON.stringify({
      browser: "0/1/2 assinaturas, falha, recuperação e mobile OK",
      api: real,
    }),
  );
} finally {
  await browser.close();
}
