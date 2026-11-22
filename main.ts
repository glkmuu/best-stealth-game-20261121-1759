import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Never delete the output directory or its contents: the grader runs this
// program twice into fresh directories and compares the bytes.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
// buildDossier returns the dossier bytes (a Uint8Array). Read them back
// and compare byte for byte so a truncated write is caught here, not by the gate.
const written = readFileSync(join(out, 'dossier.json'));
if (!Buffer.from(dossier).equals(written)) throw new Error('dossier.json read-back mismatch');
console.log(`wrote ${join(out, 'dossier.json')} (${written.length} bytes)`);
