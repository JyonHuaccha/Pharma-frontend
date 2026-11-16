import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const r = JSON.parse(await readFile('test-results/resultados.json', 'utf8'));
const version = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const filas = [];
function recorrer(suites) {
  for (const s of suites) {
    for (const spec of s.specs ?? []) {
      for (const t of spec.tests) filas.push([spec.title, t.repeatEachIndex + 1, t.status, t.results[0]?.duration ?? 0]);
    }
    recorrer(s.suites ?? []);
  }
}
recorrer(r.suites);
const texto = `# Resultados E2E de la sesión 14 autónoma\n\nFecha UTC: ${r.stats.startTime}. Versión frontend: ${version}.\n\nComando: npx playwright test --repeat-each=3. Un worker, retries=0.\n\nEjecutadas: ${r.stats.expected+r.stats.unexpected+r.stats.flaky}; aprobadas: ${r.stats.expected}; fallidas: ${r.stats.unexpected}; inestables: ${r.stats.flaky}; omitidas: ${r.stats.skipped}. Duración total: ${(r.stats.duration/1000).toFixed(3)} s.\n\nInforme HTML local: [abrir](../playwright-report/index.html). JSON original: test-results/resultados.json. Los archivos se regeneran con cada ejecución.\n\n| Prueba | Repetición | Estado | Duración ms |\n| --- | --- | --- | --- |\n${filas.map(f => '| '+f.join(' | ')+' |').join('\n')}\n`;
await mkdir('docs', { recursive: true });
await writeFile('docs/resultados-pruebas.md', texto);
console.log('Resultados reales guardados en docs/resultados-pruebas.md');
