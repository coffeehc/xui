import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { checkPublicEntryIndex } from './public-api.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function checkDocs() {
  const files = [(await readdir(root)).filter(name=>name.endsWith('.md')),
    (await readdir(resolve(root,'docs'),{recursive:true})).filter(name=>name.endsWith('.md')).map(name=>`docs/${name}`),
    (await readdir(resolve(root,'.agents/skills'),{recursive:true})).filter(name=>name.endsWith('.md')).map(name=>`.agents/skills/${name}`)].flat();
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
  const skillFile=resolve(root,'.agents/skills/adopt-xui/SKILL.md'),skill=await readFile(skillFile,'utf8'),match=/^---\n([\s\S]*?)\n---\n/.exec(skill);
  if(!match)throw Error('adopt-xui requires YAML frontmatter');
  const metadata=parse(match[1]);
  if(metadata?.name!=='adopt-xui'||typeof metadata.description!=='string'||!metadata.description.trim()||Object.keys(metadata).some(key=>!['name','description'].includes(key))||/TODO|\[placeholder\]/i.test(skill))throw Error('Invalid adopt-xui metadata or unfinished instructions');
  const interfaceConfig=parse(await readFile(resolve(root,'.agents/skills/adopt-xui/agents/openai.yaml'),'utf8'));
  if(!interfaceConfig.interface?.default_prompt?.includes('$adopt-xui'))throw Error('Skill UI prompt must invoke $adopt-xui');
  const publicEntries=await checkPublicEntryIndex(await readFile(resolve(root,'docs/PUBLIC_API.md'),'utf8'));
  return { files: files.length, links, publicEntries, skills:1 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(await checkDocs());
}
