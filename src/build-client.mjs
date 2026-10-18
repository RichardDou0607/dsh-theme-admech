import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const icons = JSON.parse(fs.readFileSync(path.join(here, 'icons.json'), 'utf8'));
// 64px feeds the 16-24px CSS-mask icons; the 256px source feeds everything drawn
// at real size (the 92px splash sigil is 138 device px at Windows 150% scaling),
// so it must be at least that large to avoid an upscaled, soft emblem.
const emblemPng = fs.readFileSync(path.join(root, 'assets', 'gear-skull-gold-64.png'));
const emblemUri = 'data:image/png;base64,' + emblemPng.toString('base64');
const emblem256 = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', 'gear-skull-gold-256.png')).toString('base64');
const css = fs.readFileSync(path.join(here, 'styles.css'), 'utf8');
const svg = fs.readFileSync(path.join(root, 'assets', 'forge-cathedral.svg'), 'utf8');
const template = fs.readFileSync(path.join(here, 'client-template.js'), 'utf8');

const bgUri = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');

const iconsJson = JSON.stringify(icons).split('__EMBLEM_ICON_URI__').join(emblemUri);
const out = template
  .replace('__ICON_BODIES__', iconsJson)
  .replace('__CSS_JSON__', JSON.stringify(css))
  .replace('__BG_URI__', bgUri)
  .replace('__EMBLEM_URI__', emblem256)
  .replace('__EMBLEM_MASK_URI__', emblemUri);

fs.writeFileSync(path.join(root, 'lib', 'client.js'), out, 'utf8');
console.log('built lib/client.js', out.length, 'bytes; bg', Math.round(bgUri.length / 1024), 'KiB');