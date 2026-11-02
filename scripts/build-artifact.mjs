// Gera um único HTML autocontido (CSS + JS embutidos) a partir de `vite build --mode artifact`.
// Uso: node scripts/build-artifact.mjs [saida.html]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
const saida = process.argv[2] ?? join(dir, 'crm-consorcio.html');
const assets = readdirSync(join(dir, 'assets'));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, 'assets', f), 'utf8')).join('\n');
const jsFiles = assets.filter((f) => f.endsWith('.js'));
if (jsFiles.length !== 1) throw new Error(`Esperado 1 bundle JS, encontrado ${jsFiles.length}`);
const js = readFileSync(join(dir, 'assets', jsFiles[0]), 'utf8').replace(/<\/script/gi, '<\\/script');

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const temaInicial = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const pagina = `<title>CRM Consórcio</title>
<meta name="theme-color" content="#FF5F15">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<script>${temaInicial}</script>
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(saida, pagina);
console.log(`OK: ${saida} (${(pagina.length / 1024).toFixed(0)} KB)`);
