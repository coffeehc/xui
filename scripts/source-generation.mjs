import {createHash} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

/** The existing build identity: sorted UTF-8 relative path, then exact file bytes. */
export async function sourceGeneration(root=process.cwd()){
  const files=['docs/DESIGN.md','package.json','tsconfig.json',
    ...(await readdir(resolve(root,'scripts'))).filter(name=>name.endsWith('.mjs')).map(name=>`scripts/${name}`),
    ...(await readdir(resolve(root,'packages/theme/src'))).map(name=>`packages/theme/src/${name}`),'packages/theme/package.json'];
  for(const name of ['runtime','ui-react'])files.push(...(await readdir(resolve(root,`packages/${name}/src`))).filter(file=>/\.(?:tsx?|json)$/.test(file)).map(file=>`packages/${name}/src/${file}`),`packages/${name}/package.json`);
  const hash=createHash('sha256');
  for(const file of files.sort())hash.update(file).update(await readFile(resolve(root,file)));
  return {sourceSha256:hash.digest('hex'),sourceFiles:files};
}
