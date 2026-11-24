import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../src/index.js';

test('the repository picker opens the result page for a dot-prefixed repository', async (t) => {
  const origin = 'https://diagram.flisk.si';
  const repo = 'flisk-sh/.github';
  const readme = 'https://github.com/flisk-sh/.github/blob/main/profile/README.md';
  const github = t.mock.method(globalThis, 'fetch', async () => Response.json({ html_url: readme }));

  const check = await worker.fetch(new Request(`${origin}/check?repo=${encodeURIComponent(`https://github.com/${repo}`)}`));
  assert.equal(check.status, 302);
  assert.equal(check.headers.get('location'), `${origin}/${repo}`);

  const result = await worker.fetch(new Request(check.headers.get('location')));
  assert.equal(result.status, 200);
  assert.match(result.headers.get('content-type'), /^text\/html\b/);
  assert.equal(github.mock.callCount(), 1);
  assert.equal(github.mock.calls[0].arguments[0], `https://api.github.com/repos/${repo}/readme`);
  const html = await result.text();
  assert.ok(html.includes(`src="${origin}/${repo}.svg"`));
  assert.ok(html.includes(`href="${readme.replace('/blob/', '/edit/')}"`));
});
