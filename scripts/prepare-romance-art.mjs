import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../public/romance-pack/', import.meta.url));
let bytes = 0;
let count = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'web') continue;
  const dest = path.join(root, 'web', entry.name);
  await mkdir(dest, { recursive: true });
  for (const file of await readdir(path.join(root, entry.name))) {
    if (!file.endsWith('.png')) continue;
    const output = path.join(dest, file.replace('.png', '.webp'));
    await sharp(path.join(root, entry.name, file))
      .resize({ width: 768, withoutEnlargement: true }).webp({ quality: 82 }).toFile(output);
    bytes += (await stat(output)).size;
    count++;
  }
}
console.log(`${count} images prepared: ${(bytes / 1024 / 1024).toFixed(1)} MB`);
