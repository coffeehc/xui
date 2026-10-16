import {build} from 'esbuild';
import {mkdir,mkdtemp,readFile,writeFile,copyFile,rename,rm,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {extract} from './tokens.mjs';
const kinds=['action-menu-react','card-group-react','admin-setup-react','text-inputs-react','choice-group-react','display-react','search-toolbar-react','data-table-react','rich-navigation-react','workspace-react','header-controls-react','sidebar-footer-react','react','foundation-react','menu-react','http-react','api-key-react','log-react','business-log-react','login-react','auth-page-react','capabilities-react','widgets-react','grouped-search-react'];
const names={'@coffeehc/xui-theme':'theme','@coffeehc/xui-runtime':'runtime','@coffeehc/xui-react':'ui-react'};
/** Development aliases target published-layout dist files, never package source. Formal verify uses installed tarballs. */
export async function buildDevExamples(){
  const stage=await mkdtemp(resolve('.artifacts/dev-'));
  const paths=[];async function visit(directory){for(const file of await readdir(directory,{withFileTypes:true})){const path=`${directory}/${file.name}`;if(file.isDirectory())await visit(path);else paths.push(path);}}await visit('examples');paths.push('scripts/dev.mjs','docs/DESIGN.md');
  const sourceHash=async()=>{const hash=createHash('sha256');for(const path of paths.sort())hash.update(path).update(await readFile(path));return hash.digest('hex');};const exampleSha256=await sourceHash();const packageStamp=await readFile('.artifacts/latest-build.json','utf8');
  try{
    const plugin={name:'xui-built-exports',setup(builder){builder.onResolve({filter:/^@coffeehc\/xui-(?:theme|runtime|react)(?:\/|$)/},async args=>{
      const name=Object.keys(names).find(name=>args.path===name||args.path.startsWith(name+'/'));const folder=names[name];const pkg=JSON.parse(await readFile(`packages/${folder}/package.json`,'utf8'));const key=args.path===name?'.':'.'+args.path.slice(name.length);const entry=pkg.exports[key];if(!entry)throw Error(`Unknown public entry ${args.path}`);return {path:resolve(`packages/${folder}`,typeof entry==='string'?entry:entry.import)};
    });builder.onResolve({filter:/^\.\/(?:layout|product)\.css$/},args=>({path:args.path,namespace:'example-css'}));builder.onLoad({filter:/.*/,namespace:'example-css'},async args=>({contents:args.path==='./layout.css'?await readFile('examples/shared/layout.css','utf8'):extract(await readFile('docs/DESIGN.md','utf8'),'design-product-css'),loader:'css'}));}};
    for(const kind of kinds){
      const react=kind.endsWith('react'),foundation=kind.startsWith('foundation'),directory=`${stage}/${kind}`;await mkdir(directory,{recursive:true});
      await build({entryPoints:foundation?{app:`examples/${kind}/app.${react?'tsx':'js'}`,'heavy-panel':`examples/${kind}/heavy-panel.${react?'tsx':'js'}`}:[`examples/${kind}/app.${react?'tsx':'js'}`],outdir:directory,bundle:true,splitting:foundation,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',plugins:[plugin],define:{'process.env.NODE_ENV':'"development"'}});
      await copyFile(`examples/${kind}/index.html`,`${directory}/index.html`);await copyFile('packages/runtime/dist/init.js',`${directory}/theme-init.js`);
      if(kind.startsWith('display-'))await copyFile('examples/shared/display-image.svg',`${directory}/display-image-a.svg`);
      if(kind.startsWith('login-')||kind.startsWith('auth-page-')){await copyFile('examples/shared/login-mark.svg',`${directory}/mark.svg`);await copyFile('examples/shared/login-visual.svg',`${directory}/visual.svg`);}
      if(kind.startsWith('business-log-'))await copyFile('examples/shared/business-log-reference.html',`${directory}/reference.html`);
      if(kind.startsWith('log-'))await copyFile('examples/shared/log-reference.html',`${directory}/reference.html`);
      if(kind.startsWith('menu-'))await copyFile('examples/shared/menu-destination.html',`${directory}/destination.html`);
      if(foundation)await copyFile('packages/theme/dist/floating.css',`${directory}/optional.css`);
      else if(kind==='react'){
        await copyFile('examples/shared/layout.css',`${directory}/layout.css`);
      }
    }
    if(await sourceHash()!==exampleSha256||await readFile('.artifacts/latest-build.json','utf8')!==packageStamp)throw Error('Source changed during example build; retry the complete generation');
    const published=[],previous=[];try{
    for(const kind of kinds){
      await mkdir('dist',{recursive:true});try{await rename(`dist/${kind}`,`${stage}/previous-${kind}`);previous.push(kind);}catch(error){if(error.code!=='ENOENT')throw error;}await rename(`${stage}/${kind}`,`dist/${kind}`);published.push(kind);
    }
    }catch(error){for(const kind of published)await rm(`dist/${kind}`,{recursive:true,force:true});for(const kind of previous)await rename(`${stage}/previous-${kind}`,`dist/${kind}`);throw error;}
    return {exampleSha256};
  }finally{await rm(stage,{recursive:true,force:true});}
}
