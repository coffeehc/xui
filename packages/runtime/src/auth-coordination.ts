/** Package-private coordination. Only safe generation metadata may leave the auth owner. */
export interface AuthEpochEvent {kind:'login'|'refresh'|'logout'|'password';epoch:string}
export interface AuthCoordination {
  run:<T>(task:()=>Promise<T>)=>Promise<T>;
  reserve:()=>string;
  publish:(kind:AuthEpochEvent['kind'],reservedEpoch?:string)=>void;
  close:()=>void;
}
export function createAuthCoordination(origin:string,receive:(event:AuthEpochEvent)=>void):AuthCoordination {
  let dead=false,tail:Promise<unknown>=Promise.resolve();
  const name=`xui.auth.v2:${origin}`,browser=typeof window!=='undefined';
  let epoch=0,identityEpoch=0,channel:BroadcastChannel|undefined;
  const clockKey=`xui.auth.clock.v1:${origin}`;
  const readClock=()=>{try{const value=browser?window.localStorage?.getItem(clockKey):null;return value&&/^\d{1,16}$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):0;}catch{return 0;}};
  try{if(browser&&typeof BroadcastChannel==='function')channel=new BroadcastChannel(name);}catch{/* Notifications are optional; requests remain server-authoritative. */}
  if(channel)channel.onmessage=({data}:MessageEvent<unknown>)=>{
    if(dead||!data||typeof data!=='object'||Array.isArray(data))return;
    const fields=Object.getOwnPropertyDescriptors(data);
    if(Object.keys(fields).length!==2||!fields.kind||!('value'in fields.kind)||!fields.epoch||!('value'in fields.epoch))return;
    const incoming=data as AuthEpochEvent;
    if(!['login','refresh','logout','password'].includes(incoming.kind)||typeof incoming.epoch!=='string'||!/^\d{1,16}$/.test(incoming.epoch))return;
    const received=Number(incoming.epoch);if(!Number.isSafeInteger(received))return;
    epoch=Math.max(epoch,received);
    // A rotation notification must not hide a delayed identity change.
    if(incoming.kind!=='refresh'){if(received<=identityEpoch)return;identityEpoch=received;}
    receive(incoming);
  };
  const reserve=()=>{
    epoch=Math.max(epoch,readClock(),Date.now())+1;
    // Only safe ordering metadata; this never restores or authorizes a session.
    try{if(browser)window.localStorage?.setItem(clockKey,String(epoch));}catch{/* The server remains authoritative without shared storage. */}
    return String(epoch);
  };
  return {
    reserve,
    run<T>(task:()=>Promise<T>):Promise<T>{
      const next=tail.catch(()=>{}).then(async()=>{
        if(dead)throw new Error('Closed auth coordination');
        // Web Locks serialize cookie mutations across tabs; local ordering also works without them.
        if(browser&&globalThis.navigator?.locks)return navigator.locks.request(name,()=>task());
        return task();
      });
      tail=next;return next;
    },
    publish(kind,reservedEpoch){
      if(dead)return;const notice=reservedEpoch??reserve(),received=Number(notice);epoch=Math.max(epoch,received);if(kind!=='refresh')identityEpoch=Math.max(identityEpoch,received);
      // A password outcome reuses its dispatch watermark even if failure handling
      // resumes after another tab has completed a newer login.
      try{channel?.postMessage({kind,epoch:notice});}catch{/* Notification failure cannot change the committed server fact. */}
    },
    close(){dead=true;channel?.close();channel=undefined;},
  };
}
