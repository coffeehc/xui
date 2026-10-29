import type {ErrorResponseAdapter, HttpResponseContext} from './http-service.js';

/** One dispatched SSE record. id persists across blocks; data joins data fields with LF. */
export interface ServerSentEvent {readonly event:string;readonly id:string;readonly data:string}
/** One explicit GET connection; no reconnect, replay, JSON inference or event queue. */
export interface SseReadOptions<T=ServerSentEvent> {
  /** Required consumer; awaited for backpressure. Check signal again after your own async work. */
  onEvent:(event:T,signal:AbortSignal)=>void|Promise<void>;
  /** Synchronous domain validation/projection. Throwing closes the stream as a safe parse error. */
  project?:(event:Readonly<ServerSentEvent>)=>T;
  /** Called after a valid 200 event-stream handshake; never exposes raw headers or credentials. */
  onOpen?:(context:Readonly<HttpResponseContext>,signal:AbortSignal)=>void|Promise<void>;
  signal?:AbortSignal;
  headers?:HeadersInit;
  endpointId?:string;
  errorAdapter?:ErrorResponseAdapter;
  /** Unmanaged API-Key/public streams may suppress the application 401 callback; managed session paths cannot. */
  unauthorized?:'notify'|'ignore';
  /** Includes header provider and error body; default HTTP timeout or 30000 ms. */
  connectTimeoutMs?:number;
  /** Between reads, including callback backpressure; default 60000 ms, explicit 0 disables. */
  idleTimeoutMs?:number;
  /** UTF-8 bytes per logical line, excluding CR/LF; default 65536, maximum 16777216. */
  maxLineBytes?:number;
  /** Sum of nonblank line bytes plus one delimiter per line per block; default 1048576. */
  maxEventBytes?:number;
  /** Explicit Last-Event-ID header. Does not promise that a server can replay missing events. */
  lastEventId?:string;
}

export function eventLimits(options:SseReadOptions<unknown>) {
  const limits={line:options.maxLineBytes??65536,event:options.maxEventBytes??1048576};
  for(const value of Object.values(limits))if(!Number.isSafeInteger(value)||value<1||value>16777216)throw new RangeError('SSE limits must be 1 through 16777216 bytes');
  return limits;
}

/** Fetch Headers takes byte strings; SSE Last-Event-ID is UTF-8 on the wire. */
export function eventIdHeader(value:string|undefined):string|undefined {
  if(value===undefined)return;
  if(typeof value!=='string'||/[\u0000-\u001f\u007f]/.test(value))throw new TypeError('Invalid Last-Event-ID');
  const bytes=new TextEncoder().encode(value);if(bytes.length>8192)throw new TypeError('Invalid Last-Event-ID');
  return Array.from(bytes,byte=>String.fromCharCode(byte)).join('');
}

/** Package-private parser: bounded wire buffers, pull-based reads and awaited dispatch. */
export async function consumeEvents(read:()=>Promise<ReadableStreamReadResult<Uint8Array>>,limits:{line:number;event:number},lastEventId:string,dispatch:(event:ServerSentEvent)=>Promise<void>) {
  const bytes=new Uint8Array(limits.line),decoder=new TextDecoder('utf-8',{ignoreBOM:true});
  let length=0,blockBytes=0,first=true,skipLF=false,event='',id=lastEventId,data:string[]=[];
  const line=async()=>{
    let text=decoder.decode(bytes.subarray(0,length));if(first){first=false;if(text.startsWith('\uFEFF'))text=text.slice(1);}
    if(!text){
      if(data.length)await dispatch(Object.freeze({event:event||'message',id,data:data.join('\n')}));
      data=[];event='';blockBytes=0;
    }else{
      blockBytes+=length+1;if(blockBytes>limits.event)throw new TypeError('SSE block limit exceeded');
      if(!text.startsWith(':')){
        const colon=text.indexOf(':'),field=colon<0?text:text.slice(0,colon);let value=colon<0?'':text.slice(colon+1);if(value.startsWith(' '))value=value.slice(1);
        if(field==='data')data.push(value);else if(field==='event')event=value;else if(field==='id'&&!value.includes('\0'))id=value;
        // retry/unknown fields never create a reconnect or an application event.
      }
    }
    length=0;
  };
  for(;;){
    const chunk=await read();if(chunk.done)return; // An unterminated final block is discarded, as in SSE.
    if(!(chunk.value instanceof Uint8Array))throw new TypeError('Expected a byte stream');
    for(const byte of chunk.value){
      if(skipLF){skipLF=false;if(byte===10)continue;}
      if(byte===13||byte===10){await line();skipLF=byte===13;}
      else{if(length===limits.line)throw new TypeError('SSE line limit exceeded');bytes[length++]=byte;}
    }
  }
}

/** Bound error/JSON responses before concatenating them; never buffer an unbounded error body. */
export async function boundedStreamText(read:()=>Promise<ReadableStreamReadResult<Uint8Array>>,maximum:number) {
  const decoder=new TextDecoder(),parts:string[]=[];let length=0;
  for(;;){const chunk=await read();if(chunk.done)break;length+=chunk.value.byteLength;if(length>maximum)throw new TypeError('Response limit exceeded');parts.push(decoder.decode(chunk.value,{stream:true}));}
  parts.push(decoder.decode());return parts.join('');
}
