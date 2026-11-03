import { PDFDocument, rgb, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { Snapshot, CONSENT } from "./domain";
type Evidence = {
  id: string;
  name: string;
  email: string;
  signed_at: string | Date;
  document_hash: string;
  method: string;
};
export async function makePdf(
  snapshot: Snapshot,
  version: number,
  hash: string,
  signatures: Evidence[],
) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(
    await readFile(
      "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
    ),
    { subset: true },
  );
  const bold = await doc.embedFont(
    await readFile(
      "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff",
    ),
    { subset: true },
  );
  const code = snapshot.code || "SCALUP-JT-001";
  doc.setTitle(snapshot.title || "Contrato Scalup × Jeremias Thomaz");
  doc.setSubject(`${code} · Versão ${version}`);
  doc.setLanguage("pt-BR");
  let page: PDFPage;
  let y = 0;
  const width = 483;
  const newPage = () => {
    page = doc.addPage([595.28, 841.89]);
    y = 780;
    page.drawText(`${code} × JEREMIAS THOMAZ  /  VERSÃO ${version}`, {
      x: 56,
      y: 808,
      size: 8,
      font: regular,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawLine({
      start: { x: 56, y: 797 },
      end: { x: 539, y: 797 },
      color: rgb(0.9, 0, 0),
      thickness: 0.6,
    });
  };
  newPage();
  for (const [idx, b64] of Object.values(snapshot.logos).entries()) {
    if (!b64) continue;
    const img = await doc.embedPng(Buffer.from(b64.split(",")[1], "base64"));
    const scale = Math.min(170 / img.width, 48 / img.height);
    page!.drawRectangle({
      x: 56 + idx * 245,
      y: y - 60,
      width: 200,
      height: 64,
      color: rgb(0, 0, 0),
    });
    page!.drawImage(img, {
      x: 70 + idx * 245,
      y: y - 50,
      width: img.width * scale,
      height: img.height * scale,
    });
  }
  if (Object.values(snapshot.logos).some(Boolean)) y -= 85;
  function paragraph(text: string, font: PDFFont, size = 10.5, gap = 9) {
    if (text.includes("\n")) {
      for (const part of text.split("\n").filter(Boolean))
        paragraph(part, font, size, 3);
      y -= gap;
      return;
    }
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      if (font.widthOfTextAtSize(word, size) > width) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let chunk = "";
        for (const c of word) {
          if (font.widthOfTextAtSize(chunk + c, size) > width) {
            lines.push(chunk);
            chunk = "";
          }
          chunk += c;
        }
        line = chunk;
        continue;
      }
      const test = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(test, size) > width) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    if (y < 85 + size * 1.55 * Math.min(lines.length, 3)) newPage();
    for (const l of lines) {
      if (y < 70) newPage();
      page.drawText(l, { x: 56, y, size, font, color: rgb(0, 0, 0) });
      y -= size * 1.55;
    }
    y -= gap;
  }
  for (const block of snapshot.text.split(/\n\s*\n/)) {
    const clean = block
      .replace(/\*\*/g, "")
      .replace(/^#{1,3}\s*/, "")
      .replace(/^---$/gm, "")
      .trim();
    if (!clean) continue;
    const heading = block.startsWith("#");
    if (heading) y -= 10;
    paragraph(
      clean,
      heading ? bold : regular,
      block.startsWith("# ") ? 17 : heading ? 12 : 10.5,
      heading ? 13 : 8,
    );
  }
  newPage();
  paragraph(
    signatures.length === 2
      ? "COMPROVANTE DE ASSINATURAS ELETRÔNICAS"
      : "DOCUMENTO PARA REVISÃO — ASSINATURAS PENDENTES",
    bold,
    16,
    18,
  );
  paragraph(`Contrato ${code} · Versão ${version}`, bold);
  paragraph(`SHA-256 do conteúdo e metadados imutáveis: ${hash}`, regular, 9);
  paragraph(
    "Modalidade: aceite eletrônico com verificação por código de e-mail. Este documento não é uma assinatura digital qualificada ICP-Brasil.",
    regular,
  );
  if (!signatures.length)
    paragraph("Nenhuma assinatura registrada neste documento.", regular);
  for (const s of signatures) {
    y -= 14;
    paragraph(s.name, bold, 12);
    paragraph(
      `E-mail verificado: ${s.email}\nData e hora (UTC): ${new Date(s.signed_at).toISOString()}\nEvento: ${s.id}`,
      regular,
    );
    paragraph(
      `Método: ${s.method}. Declaração expressamente aceita: ${CONSENT}`,
      regular,
      9,
    );
  }
  for (const [index, p] of doc.getPages().entries())
    p.drawText(
      `${code}  ·  ${signatures.length === 2 ? "Assinado eletronicamente" : "Para revisão"}  ·  Página ${index + 1} de ${doc.getPageCount()}`,
      { x: 56, y: 35, size: 8, font: regular, color: rgb(0.4, 0.4, 0.4) },
    );
  return Buffer.from(await doc.save());
}
