/**
 * Bouwt apexclusive-bundle.css voor index.html.
 *
 * Voegt de 7 losse stylesheets samen in precies dezelfde volgorde als de
 * <link rel="stylesheet"> tags in de <head> van index.html stonden, zodat de
 * cascade en daarmee het uiterlijk ongewijzigd blijft.
 *
 * Gebruik:  npm run build:css   (of: node scripts/build-css.mjs)
 * Zero dependencies, alleen Node's eigen modules.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Volgorde = laadvolgorde in index.html. Niet wijzigen zonder de <head> te checken. */
const SOURCES = [
  'apexclusive-modern.css',
  'apexclusive-brand.css',
  'apexclusive-ai.css',
  'apexclusive-quality.css',
  'apexclusive-scale.css',
  'apexclusive-finish.css',
  'apexclusive-overview.css'
];

const OUTPUT = 'apexclusive-bundle.css';

const header = `/*!
 * apexclusive-bundle.css — GEGENEREERD BESTAND, NIET HANDMATIG WIJZIGEN.
 * Bron: ${SOURCES.join(', ')}
 * Bouwen: npm run build:css  (scripts/build-css.mjs)
 */
`;

const parts = [];
for (const file of SOURCES) {
  let css = await readFile(path.join(root, file), 'utf8');
  css = css.replace(/^﻿/, ''); // eventuele BOM verwijderen

  // @charset/@import mogen alleen helemaal bovenaan een stylesheet staan;
  // na samenvoegen zouden ze de CSS breken.
  const illegal = css.match(/@charset|@import/);
  if (illegal) {
    throw new Error(`${file} bevat ${illegal[0]}; dat kan niet midden in een bundel staan.`);
  }

  parts.push(`/* === ${file} === */\n${css.trim()}`);
}

const bundle = header + parts.join('\n\n') + '\n';
await writeFile(path.join(root, OUTPUT), bundle, 'utf8');

console.log(`${OUTPUT}: ${SOURCES.length} bestanden samengevoegd (${bundle.length} bytes).`);
