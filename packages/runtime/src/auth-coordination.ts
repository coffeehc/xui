/** Package-private coordination. Only safe generation metadata may leave the auth owner. */
export interface AuthEpochEvent {kind:'login'|'refresh'|'logout';epoch:string}
export interface AuthCoordination {
  run:<T>(task:()=>Promise<T>)=>Promise<T>;
  publish:(kind:AuthEpochEvent['kind'])=>void;
  close:()=>void;
}
export function createAuthCoordination(origin:string,receive:(event:AuthEpochEvent)=>void):AuthCoordination {
  let dead=false,tail:Promise<unknown>=Promise.resolve();
  const name=`xui.auth.v2:${origin}`,browser=typeof window!=='undefined',storageKey=name+':epoch';
  type EpochRecord={epoch:number;identityEpoch:number;kind:'login'|'logout'};
  const stored=():EpochRecord=>{
    try{const value=JSON.parse(browser?window.localStorage.getItem(storageKey)??'null':'null');if(value&&Number.isSafeInteger(value.epoch)&&value.epoch>0&&Number.isSafeInteger(value.identityEpoch)&&value.identityEpoch>=0&&value.identityEpoch<=value.epoch&&['login','logout'].includes(value.kind))return value;}catch{/* Storage failure does not expose credentials. */}
    return {epoch:0,identityEpoch:0,kind:'login'};
  };
  let known=stored(),channel:BroadcastChannel|undefined;
  try{if(browser&&typeof BroadcastChannel==='function')channel=new BroadcastChannel(name);}catch{/* Server conflict remains fail-closed. */}
  if(channel)channel.onmessage=({data}:MessageEvent<unknown>)=>{
    if(dead||!data||typeof data!=='object'||Array.isArray(data))return;
    const fields=Object.getOwnPropertyDescriptors(data);
    if(Object.keys(fields).length!==2||!fields.kind||!('value'in fields.kind)||!fields.epoch||!('value'in fields.epoch))return;
    const {kind,epoch}=data as AuthEpochEvent;
    if(!['login','refresh','logout'].includes(kind)||typeof epoch!=='string'||!/^\d{1,16}$/.test(epoch))return;
    const incoming=Number(epoch);if(!Number.isSafeInteger(incoming))return;
    const latest=stored();
    // A newer rotation notification must not hide a missed login/logout identity change.
    if(latest.identityEpoch>known.identityEpoch){known=latest;receive({kind:latest.kind,epoch:String(latest.identityEpoch)});return;}
    if(incoming<=known.epoch||incoming<latest.epoch)return;
    known={...known,epoch:incoming};receive({kind,epoch});
  };
  return {
    run<T>(task:()=>Promise<T>):Promise<T>{
      const next=tail.catch(()=>{}).then(async()=>{
        if(dead)throw new Error('Closed auth coordination');
        // Web Locks serialize cookie mutations across tabs; local ordering also works without them.
        if(browser&&globalThis.navigator?.locks)return navigator.locks.request(name,()=>task());
        return task();
      });
      tail=next;return next;
    },
    publish(kind){
      if(dead)return;const latest=stored(),epoch=Math.max(known.epoch,latest.epoch,Date.now())+1;
      const identity=latest.identityEpoch>known.identityEpoch?latest:known;
      known={epoch,identityEpoch:kind==='refresh'?identity.identityEpoch:epoch,kind:kind==='refresh'?identity.kind:kind};
      // This contains no identity, cookie or access token. It fences delayed cross-sender events.
      try{if(browser)window.localStorage.setItem(storageKey,JSON.stringify(known));}catch{/* Without storage, server conflict remains the final safety boundary. */}
      try{channel?.postMessage({kind,epoch:String(epoch)});}catch{/* Notification failure cannot change the committed server fact. */}
    },
    close(){dead=true;channel?.close();channel=undefined;},
  };
}
