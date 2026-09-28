import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { CHARACTERS } from '../src/romance.js';

await mkdir(new URL('../public/romance-pack/rigs/', import.meta.url), { recursive: true });
for (const { id } of CHARACTERS) {
  const input = new URL(`../art-source/rigs/${id}.png`, import.meta.url);
  const output = new URL(`../public/romance-pack/rigs/${id}.webp`, import.meta.url);
  const image = sharp(input.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const metadata = await image.metadata();
  if (metadata.width !== 1536 || metadata.height !== 1024 || !metadata.hasAlpha) {
    throw new Error(`${id}: expected a transparent 1536x1024 three-frame atlas`);
  }
  const result = await image.webp({ quality: 94, alphaQuality: 100 })
    .toFile(output.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  console.log(`${id}: ${Math.round(result.size / 1024)} KB`);
}
