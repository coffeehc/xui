import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/vanilla'||pathname.startsWith('/vanilla/')||pathname.split('/').some(segment=>segment.endsWith('-vanilla'))){res.writeHead(404).end('Not found');return;}
  if(pathname==='/api/xui-example/events'){
    const mode=new URL(req.url,'http://localhost').searchParams.get('mode');
    if(req.method!=='GET'){res.writeHead(405).end();return;}
    if(['denied','forbidden'].includes(mode)){const status=mode==='denied'?401:403;res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify({success:false,code:status*100,payload:null,message:'Synthetic rejection',request_id:'events-fixture'}));return;}
    res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','X-Request-ID':'events-fixture'});res.flushHeaders();
    const content=mode==='large'?'data: '+'X'.repeat(65537)+'\n\n':':heartbeat\r\nevent: event\r\nid: 7\r\ndata: {"sequence":1,\r\ndata: "label":"中文😀分片"}\r\n\r\ndata: {"sequence":2,"label":"多行与继承ID"}\n\nid:\ndata: {"sequence":3,"label":"清除ID"}\n\n';
    const bytes=Buffer.from(content);let offset=0,timer;const send=()=>{if(res.destroyed)return;if(offset<bytes.length){const end=Math.min(bytes.length,offset+(mode==='large'?4096:7));res.write(bytes.subarray(offset,end));offset=end;timer=setTimeout(send,2);}else if(mode==='live'){res.write(':heartbeat\n\n');timer=setTimeout(send,5000);}else res.end();};
    res.on('close',()=>clearTimeout(timer));send();return;
  }
  if(pathname==='/api/xui-example/records'){
    const params=new URL(req.url,'http://localhost').searchParams;const index=Number(params.get('page_index')),size=Number(params.get('page_size'));
    if(req.method!=='GET'||!Number.isSafeInteger(index)||index<0||!Number.isSafeInteger(size)||size<1||size>50){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({success:false,message:'Invalid demo query',payload:null,request_id:'demo-request',code:400001}));return;}
    let list=JSON.parse(await readFile('examples/shared/http-records.json','utf8'));const name=params.get('name');if(name)list=list.filter(item=>item.name.includes(name));
    for(const key of (params.get('sort')??'').split(',').reverse())if(['name','created'].includes(key)&&['asc','desc'].includes(params.get('sort_'+key)))list.sort((a,b)=>a[key].localeCompare(b[key],'zh-CN')*(params.get('sort_'+key)==='desc'?-1:1));
    res.writeHead(200,{'Content-Type':'application/json','X-Request-ID':'demo-header'}).end(JSON.stringify({success:true,message:'',payload:{list:list.slice(index*size,(index+1)*size),...(params.get('return_total')==='true'?{total:list.length}:{})},request_id:'demo-request',code:1}));return;
  }
  // The History-routing example has an explicit HTML fallback; assets/other apps retain 404s.
  const routePath=/^\/bootstrap-react\/(?:tasks|settings|long)$/.test(pathname)?'/bootstrap-react/':pathname;
  const file = resolve(root,'.'+routePath+(routePath.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root+sep)) { res.writeHead(403).end(); return; }
  try { const data = await readFile(file); res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[extname(file)] || 'application/octet-stream');res.end(data); }
  catch { res.writeHead(404).end('Not found'); }
});
const port=Number(process.env.XUI_PREVIEW_PORT??4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new RangeError('Invalid XUI_PREVIEW_PORT');
server.listen(port,'127.0.0.1',() => console.log(`React consumer preview at http://127.0.0.1:${port}/`));
