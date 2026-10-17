/** Original prose is never rewritten; only accepted absolute HTTP(S) spans become links. */
export type TextLinkPart=Readonly<{type:'text';text:string}|{type:'link';text:string;href:string}>;
const unsafe=/[\u0000-\u0020\u007f-\u009f\\]|\p{Default_Ignorable_Code_Point}/u;
const boundary=/[\t\r\n\p{Z}<>"'`，。！？；：、…“”‘’「」『』《》〈〉【】〔〕（）［］｛｝]/u;
const embedded=/(?:[A-Za-z0-9_@%\\:/]|\p{Default_Ignorable_Code_Point})$/u;
/** No base URL, browser repair of an authority, credentials, controls or hidden characters. */
export function parseHttpURL(value:string):string|null {
 if(typeof value!=='string'||unsafe.test(value))return null;
 const authority=/^https?:\/\/([^/?#]+)/i.exec(value)?.[1];
 if(!authority||/[@%]/.test(authority)||authority.normalize('NFKC')!==authority)return null;
 const host=/^(\[[\da-f:.]+\]|[^:]+)(?::\d+)?$/i.exec(authority)?.[1];
 if(!host)return null;
 try{
  const url=new URL(value);
  if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password)return null;
  if(/^[\x00-\x7f]+$/.test(host)&&host[0]!=='['&&url.hostname!==host.toLowerCase())return null;
  return url.href;
 }catch{return null;}
}
function proseLength(value:string):number {
 const closers:Record<string,string>={')':'(',']':'[','}':'{'},depth:Record<string,number>={'(':0,'[':0,'{':0},unmatched=new Set<number>();
 for(let index=0;index<value.length;index++){
  const char=value[index];if(Object.hasOwn(depth,char))depth[char]++;
  else if(Object.hasOwn(closers,char)){const opener=closers[char];if(depth[opener])depth[opener]--;else unmatched.add(index);}
 }
 let end=value.length;while(end&&(/[.,;:!?]/.test(value[end-1])||unmatched.has(end-1)))end--;
 return end;
}
/** Linear scans; preserves every original UTF-16 code unit, including rejected candidates. */
export function linkifyText(text:string):readonly TextLinkPart[] {
 const starts=/https?:\/\//gi,parts:TextLinkPart[]=[];let cursor=0,match:RegExpExecArray|null;
 while((match=starts.exec(text))){
  const start=match.index;if(start&&embedded.test(text.slice(Math.max(0,start-2),start)))continue;
  let end=starts.lastIndex;while(end<text.length&&!boundary.test(text[end]))end++;
  starts.lastIndex=end;
  const candidate=text.slice(start,end),length=proseLength(candidate),label=candidate.slice(0,length),href=unsafe.test(candidate)?null:parseHttpURL(label);
  if(!href)continue;
  if(start>cursor)parts.push(Object.freeze({type:'text',text:text.slice(cursor,start)}));
  parts.push(Object.freeze({type:'link',text:label,href}));cursor=start+length;
 }
 if(cursor<text.length)parts.push(Object.freeze({type:'text',text:text.slice(cursor)}));
 return Object.freeze(parts);
}
