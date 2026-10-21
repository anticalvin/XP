import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('GitHub Pages app and nested module assets use repository-relative paths', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(html, /href="\.\/style\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(app, /from '\.\/core\.js'/);
  assert.doesNotMatch(html, /(?:href|src)="\/(?:style\.css|app\.js)/);
});
