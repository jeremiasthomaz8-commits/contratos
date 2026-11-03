import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFile, writeFile } from "node:fs/promises";
const doc = await getDocument({
  data: new Uint8Array(await readFile("test-results/contrato-teste.pdf")),
  useSystemFonts: true,
}).promise;
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const viewport = page.getViewport({ scale: 1.4 });
  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  await page.render({
    canvasContext: canvas.getContext("2d"),
    viewport,
    canvas,
  }).promise;
  await writeFile(
    `test-results/pdf-page-${n}.png`,
    canvas.toBuffer("image/png"),
  );
}
console.log(`PDF: ${doc.numPages} páginas, todas renderizadas.`);
