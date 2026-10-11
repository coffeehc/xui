import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = resolve(root,'.'+pathname+(pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root+sep)) { res.writeHead(403).end(); return; }
  try { const data = await readFile(file); res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)] || 'application/octet-stream');res.end(data); }
  catch { res.writeHead(404).end('Not found'); }
});
server.listen(4173,'127.0.0.1',() => console.log('Preview at http://localhost:4173/{vanilla,react}/'));
