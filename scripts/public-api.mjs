import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const root=fileURLToPath(new URL('../',import.meta.url));
/** Read actual manifests and declarations; never maintain a second list of exports. */
export async function collectPublicAPI({symbols=true}={}){
  const entries=[];
  for(const directory of ['theme','runtime','ui-react']){
    const manifest=JSON.parse(await readFile(resolve(root,'packages',directory,'package.json'),'utf8'));
    for(const [entry,value] of Object.entries(manifest.exports)){
      const target=typeof value==='string'?value:value.import;
      entries.push({package:manifest.name,entry,specifier:manifest.name+(entry==='.'?'':entry.slice(1)),directory,target,types:typeof value==='object'?value.types:null,kind:target.endsWith('.css')?'css':target.endsWith('.json')?'json':entry==='./init.js'?'classic':'esm'});
    }
  }
  if(symbols){
    const roots=entries.filter(entry=>entry.types).map(entry=>resolve(root,'packages',entry.directory,entry.types));
    const program=ts.createProgram(roots,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,skipLibCheck:true}),checker=program.getTypeChecker();
    for(const entry of entries.filter(entry=>entry.types)){
      const source=program.getSourceFile(resolve(root,'packages',entry.directory,entry.types));
      if(!source)throw Error(`Missing built declarations: ${entry.specifier}`);
      const module=checker.getSymbolAtLocation(source);if(!module)throw Error(`Invalid module declarations: ${entry.specifier}`);
      const exports=checker.getExportsOfModule(module);
      entry.symbols=exports.map(symbol=>symbol.getName()).sort();
      entry.values=exports.filter(symbol=>((symbol.flags&ts.SymbolFlags.Alias)?checker.getAliasedSymbol(symbol):symbol).flags&ts.SymbolFlags.Value).map(symbol=>symbol.getName()).sort();
    }
  }
  return entries;
}

export async function checkPublicEntryIndex(source){
  const entries=await collectPublicAPI({symbols:false}),actual=entries.map(entry=>entry.specifier).sort(),documented=Array.from(source.matchAll(/<!-- public-entry: ([^\s]+) -->/g),match=>match[1]).sort();
  if(JSON.stringify(actual)!==JSON.stringify(documented))throw Error('PUBLIC_API.md must map every current manifest export exactly once');
  return actual.length;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const entries=await collectPublicAPI();await mkdir(resolve(root,'.artifacts'),{recursive:true});
  await writeFile(resolve(root,'.artifacts/public-api.json'),JSON.stringify({entries},null,2)+'\n');
  console.log(`${entries.length} public entries recorded from manifests and built declarations.`);
}
