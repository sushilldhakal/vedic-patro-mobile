#!/usr/bin/env node
/** Regenerate app icons and web favicons from assets/favicon.svg. */
import { copyFile, mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = join(root, "assets/favicon.svg");
const publicDir = join(root, "public");

await mkdir(publicDir, { recursive: true });

const icon = sharp(svg);

await icon.clone().resize(1024, 1024).png().toFile(join(root, "assets/icon.png"));
await icon.clone().resize(1024, 1024).png().toFile(join(root, "assets/adaptive-icon.png"));

await copyFile(svg, join(publicDir, "favicon.svg"));
await icon.clone().resize(32, 32).png().toFile(join(publicDir, "favicon-32.png"));
await icon.clone().resize(180, 180).png().toFile(join(publicDir, "apple-touch-icon.png"));

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((size) => icon.clone().resize(size, size).png().toBuffer()),
);
await writeFile(join(publicDir, "favicon.ico"), await toIco(icoBuffers));

const distWeb = join(root, "dist-web");
try {
  await copyFile(join(publicDir, "favicon.ico"), join(distWeb, "favicon.ico"));
  await copyFile(join(publicDir, "favicon.svg"), join(distWeb, "favicon.svg"));
  await copyFile(join(publicDir, "favicon-32.png"), join(distWeb, "favicon-32.png"));
  await copyFile(join(publicDir, "apple-touch-icon.png"), join(distWeb, "apple-touch-icon.png"));
} catch {
  // dist-web may not exist until first web export
}

console.log("Updated icon.png, adaptive-icon.png, public/, and dist-web favicon assets from favicon.svg");
