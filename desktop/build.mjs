// Bundles the game (shared with the website) into desktop/app for Electron.
// Needs `npm install` to have been run in the repo root as well as in desktop/.

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(here, 'app');
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [path.join(here, 'renderer.tsx')],
  outfile: path.join(out, 'renderer.js'),
  bundle: true,
  minify: true,
  jsx: 'automatic',
  alias: { '@': root },
  nodePaths: [path.join(root, 'node_modules')],
  define: { 'process.env.NODE_ENV': '"production"' },
  logOverride: { 'module-level-directive': 'silent' }, // "use client" is a Next.js-only hint
});

// Tailwind classes used by the game, then the game's own animations.
const cssIn = path.join(out, 'tailwind-input.css');
const cssOut = path.join(out, 'renderer.css');
writeFileSync(cssIn, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
const tailwindCli = path.join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
execFileSync(
  process.execPath,
  [tailwindCli, '-i', cssIn, '-o', cssOut, '--minify', '--content', path.join(root, 'components/hidey/**/*.tsx')],
  { cwd: root, stdio: 'inherit' },
);
appendFileSync(cssOut, '\n' + readFileSync(path.join(root, 'app/hidey-dots/hidey.css'), 'utf8'));

writeFileSync(
  path.join(out, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="only light">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'">
<title>Hidey Dots</title>
<link rel="stylesheet" href="renderer.css">
</head>
<body style="margin:0;background:#fdf6e3">
<div id="root"></div>
<script src="renderer.js"></script>
</body>
</html>
`,
);
console.log('Built desktop/app');
