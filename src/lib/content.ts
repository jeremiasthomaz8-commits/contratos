import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import knownDetails from "../../content/known-details.json";
export const contractSource = () =>
  readFile(path.join(process.cwd(), "content/contract.md"), "utf8");
export async function contractPreview() {
  return (await contractSource())
    .replace(
      "CNPJ sob nº ____________________",
      "CNPJ sob nº " + knownDetails.companyCnpj,
    )
    .replace(
      "CNPJ: ____________________________________",
      "CNPJ: " + knownDetails.companyCnpj,
    );
}
export async function logo(name: "scalup" | "jeremias") {
  for (const ext of ["svg", "png", "webp"]) {
    try {
      const b = await readFile(
        path.join(process.cwd(), `public/brand/${name}.${ext}`),
      );
      return (
        "data:image/png;base64," +
        (
          await sharp(b)
            .resize({ width: 800, withoutEnlargement: true })
            .png()
            .toBuffer()
        ).toString("base64")
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  return null;
}
export async function logos() {
  return { scalup: await logo("scalup"), jeremias: await logo("jeremias") };
}
