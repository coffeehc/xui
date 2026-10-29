import {HTTPService,type SseReadOptions,type ServerSentEvent} from '@coffeehc/xui-runtime/http';
const options:SseReadOptions={onEvent(event,signal){const raw:string=event.data;void [raw,signal.aborted];}};
void HTTPService.readEvents('/events',options);
void HTTPService.readEvents('/events',{project:(event:ServerSentEvent)=>({length:event.data.length}),onEvent(value){const count:number=value.length;void count;}});
// @ts-expect-error Typed projection is required when a caller declares a different payload type.
void HTTPService.readEvents<{value:number}>('/events',{onEvent(value){void value.value;}});
// @ts-expect-error An SSE read cannot become a write.
void HTTPService.readEvents('/events',{method:'POST',onEvent(){}});
// @ts-expect-error No implicit reconnect/retry policy.
void HTTPService.readEvents('/events',{retry:{idempotentRead:true,maxAttempts:2},onEvent(){}});
