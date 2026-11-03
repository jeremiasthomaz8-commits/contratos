import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const b = await chromium.launch({ headless: true, channel: "msedge" });
const j =
  "data:image/webp;base64," +
  (await readFile("public/brand/jeremias.webp")).toString("base64");
const client =
  "data:image/png;base64," +
  (await readFile("public/brand/scalup.png")).toString("base64");
const source = await readFile("content/contract.md", "utf8");
try {
  const context = await b.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const p = await context.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const entries = [
    {
      code: "SCALUP-JT-001",
      title: "Design e edição de vídeos",
      client_name: "SCALUP",
      client_email: "cliente@example.test",
      has_logo: true,
      status: "partial",
      signatures: 1,
      current_version: "v1",
      created_at: new Date().toISOString(),
    },
    {
      code: "JT-DEMO1234",
      title: "Identidade visual",
      client_name: "Estúdio Aurora",
      client_email: "aurora@example.test",
      has_logo: false,
      status: "draft",
      signatures: 0,
      current_version: null,
      created_at: new Date().toISOString(),
    },
  ];
  let settings = {
    title: "Identidade visual",
    clientName: "Estúdio Aurora",
    clientEmail: "aurora@example.test",
    clientLogo: null,
    source,
  };
  let created = false;
  const scoped = [];
  const draft = {
    companyName: "Cliente Teste",
    companyCnpj: "11.222.333/0001-81",
    companyAddress: "Endereço teste",
    representative: "Representante teste",
    authority: "Titular",
    contractorAddress: "Endereço de teste",
    startDate: "2026-11-03",
    place: "Jundiaí",
    executionDate: "2026-11-03",
    venue: "Jundiaí",
    revisions: "10 revisões",
    adaptations: "Formatos acordados",
  };
  await p.route("**/api/**", async (r) => {
    const u = new URL(r.request().url());
    const method = r.request().method();
    if (u.pathname === "/api/admin/contracts") {
      if (method === "POST") {
        settings = { ...r.request().postDataJSON(), source };
        created = true;
        await r.fulfill({ status: 201, json: { code: "JT-NEW12345" } });
      } else await r.fulfill({ json: { contracts: entries, providerLogo: j } });
      return;
    }
    if (u.pathname === "/api/admin/logo") {
      await r.fulfill({
        contentType: "image/png",
        body: await readFile("public/brand/scalup.png"),
      });
      return;
    }
    if (u.pathname === "/api/admin") {
      assert.equal(
        u.searchParams.get("agreement"),
        created ? "JT-NEW12345" : "JT-DEMO1234",
      );
      await r.fulfill({
        json: {
          agreement: {
            code: u.searchParams.get("agreement"),
            draft,
            status: "draft",
            current_version: null,
          },
          settings,
          logos: { scalup: settings.clientLogo, jeremias: j },
          config: {},
          versions: [],
          signatures: [],
          emails: [],
          jobs: [],
        },
      });
      return;
    }
    if (u.pathname.startsWith("/api/admin/")) {
      assert.ok(u.searchParams.get("agreement"));
      scoped.push(u.pathname);
      if (u.pathname === "/api/admin/settings") {
        assert.equal("jeremias" in r.request().postDataJSON(), false);
      }
      await r.fulfill({
        json: { message: "Salvo", text: "Contrato de teste" },
      });
      return;
    }
    await r.fulfill({ json: {} });
  });
  await p.goto("http://127.0.0.1:3000/admin", { waitUntil: "networkidle" });
  await p.getByRole("heading", { name: "Contratos", exact: true }).waitFor();
  assert.equal(await p.locator(".contract-row").count(), 2);
  await mkdir("test-results", { recursive: true });
  await p.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await p.getByRole("searchbox").fill("Aurora");
  assert.equal(await p.locator(".contract-row").count(), 1);
  await p.getByRole("searchbox").fill("");
  await p.getByRole("combobox").selectOption("pending");
  assert.equal(await p.locator(".contract-row").count(), 1);
  await p.getByRole("combobox").selectOption("all");
  await p.getByRole("button", { name: "Novo contrato" }).click();
  await p.getByLabel("Título do contrato").fill("Projeto de teste");
  await p.getByLabel("Nome do cliente / marca").fill("Marca Parceira");
  await p
    .getByLabel("E-mail do cliente para assinatura")
    .fill("nova@example.test");
  await p
    .locator('input[type="file"]')
    .setInputFiles("public/brand/scalup.png");
  await p.getByAltText("Logo Marca Parceira").waitFor();
  await p.screenshot({ path: "test-results/new-contract.png", fullPage: true });
  const createAxe = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    createAxe.violations.map((v) => v.id),
    [],
  );
  await p.getByRole("button", { name: "Criar rascunho" }).click();
  await p
    .getByRole("heading", { name: "Projeto de teste", exact: true })
    .waitFor();
  assert.equal(created, true);
  await p.getByRole("button", { name: "Salvar rascunho" }).click();
  await p.getByRole("status").filter({ hasText: "Salvo" }).waitFor();
  assert.ok(scoped.includes("/api/admin/draft"));
  assert.ok(scoped.includes("/api/admin/settings"));
  await p.getByRole("button", { name: "Todos os contratos" }).click();
  await p.getByRole("heading", { name: "Contratos", exact: true }).waitFor();
  for (const width of [390, 320]) {
    await p.setViewportSize({ width, height: 900 });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await p.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    accessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
    [],
  );
  assert.deepEqual(errors, []);
  for (const path of [
    "admin/contracts",
    "admin?agreement=JT-DEMO1234",
    "admin/logo?agreement=JT-DEMO1234",
  ]) {
    const res = await fetch("http://127.0.0.1:3000/api/" + path);
    assert.equal(res.status, 401);
  }
  console.log(
    "Dashboard: busca, filtros, criação com logo, edição isolada, responsividade, acessibilidade e proteção de acesso OK.",
  );
} finally {
  await b.close();
}
