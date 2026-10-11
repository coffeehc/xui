import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function checkDocs() {
  const files = ['README.md', ...(await readdir(resolve(root, 'docs'), { recursive: true }))
    .filter((name) => name.endsWith('.md')).map((name) => `docs/${name}`)];
  let links = 0;
  for (const file of files) {
    const source = await readFile(resolve(root, file), 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1].replace(/^<|>$/g, '');
      if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;
      const path = decodeURIComponent(target.split('#')[0]);
      if (!path) continue;
      try { await access(resolve(root, dirname(file), path)); }
      catch { throw new Error(`${file}: missing relative link ${target}`); }
      links++;
    }
  }
  return { files: files.length, links };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(await checkDocs());
}
