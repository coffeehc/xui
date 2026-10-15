import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/vanilla'||pathname.startsWith('/vanilla/')||pathname.split('/').some(segment=>segment.endsWith('-vanilla'))){res.writeHead(404).end('Not found');return;}
  if(pathname==='/api/xui-example/records'){
    const params=new URL(req.url,'http://localhost').searchParams;const index=Number(params.get('page_index')),size=Number(params.get('page_size'));
    if(req.method!=='GET'||!Number.isSafeInteger(index)||index<0||!Number.isSafeInteger(size)||size<1||size>50){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({success:false,message:'Invalid demo query',payload:null,request_id:'demo-request',code:400001}));return;}
    let list=JSON.parse(await readFile('examples/shared/http-records.json','utf8'));const name=params.get('name');if(name)list=list.filter(item=>item.name.includes(name));
    for(const key of (params.get('sort')??'').split(',').reverse())if(['name','created'].includes(key)&&['asc','desc'].includes(params.get('sort_'+key)))list.sort((a,b)=>a[key].localeCompare(b[key],'zh-CN')*(params.get('sort_'+key)==='desc'?-1:1));
    res.writeHead(200,{'Content-Type':'application/json','X-Request-ID':'demo-header'}).end(JSON.stringify({success:true,message:'',payload:{list:list.slice(index*size,(index+1)*size),...(params.get('return_total')==='true'?{total:list.length}:{})},request_id:'demo-request',code:1}));return;
  }
  const file = resolve(root,'.'+pathname+(pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root+sep)) { res.writeHead(403).end(); return; }
  try { const data = await readFile(file); res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[extname(file)] || 'application/octet-stream');res.end(data); }
  catch { res.writeHead(404).end('Not found'); }
});
server.listen(4173,'127.0.0.1',() => console.log('React consumer preview at http://localhost:4173/'));
