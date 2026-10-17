import {parseEntityId} from './entity-id.js';
import {parseCalendarDate,shiftCalendarDate} from './calendar.js';
import {parseDateTimeValue} from './date-time.js';
import {parseNumberDraft,stepNumber} from './number-input.js';
import {resolveDownloadFileName} from './download-file-name.js';
import {parseHttpURL,linkifyText} from './text-links.js';
/** Stateless, immutable utility namespace. No registry, storage, network or component state. */
const utilities=Object.freeze({
  entityId:Object.freeze({parse:parseEntityId}),
  date:Object.freeze({parse:parseCalendarDate,shift:shiftCalendarDate}),
  dateTime:Object.freeze({parse:parseDateTimeValue}),
  number:Object.freeze({parseDraft:parseNumberDraft,step:stepNumber}),
  download:Object.freeze({resolveFileName:resolveDownloadFileName}),
  url:Object.freeze({parseHttp:parseHttpURL}),
  text:Object.freeze({linkify:linkifyText}),
});
export type UtilService=typeof utilities;
/** Shared pure capabilities; existing narrow utility exports remain valid. */
export function getUtilService():UtilService{return utilities;}

/** Pure singleton namespace; no application registry, network or component state. */
export const UtilService=utilities;
