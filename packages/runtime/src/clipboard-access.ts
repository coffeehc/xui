import {registerService} from './service-resolvers.js';
import {buildClipboardService,type SharedClipboardService} from './clipboard-service.js';
import {browserState,optionsFor,sameValue,type RegistryState} from './service-state.js';
export function resolveClipboardService(state:RegistryState):SharedClipboardService{
    const entry=state.clipboard;if(entry.value)return entry.value;
    const options=optionsFor(entry)??{};entry.value=buildClipboardService({navigator:state.window?.navigator??null,document:state.window?.document??null,...options});entry.owned=true;entry.resolvedOptions=options;return entry.value;
  }
export function getClipboardService():SharedClipboardService{return resolveClipboardService(browserState());}

registerService('clipboard',resolveClipboardService);
