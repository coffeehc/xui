// Shared by separately bundled runtime copies in the same document. Reserving
// IDs here (rather than counting mounted nodes) also covers detached roots and
// destroy/recreate cycles without retaining elements or an ever-growing ID set.
const stateKey = Symbol.for('@coffeehc/xui-runtime/dom-id/v1');
type IdDocument = Document & {[stateKey]?: {next: bigint}};

/** Internal UI identity only: never use for credentials, tokens or request keys. */
export function generateDomId(document: Document, prefix: string): string {
  const doc = document as IdDocument;
  let state = doc[stateKey];
  if (!state) {
    state = {next: 0n};
    Object.defineProperty(doc, stateKey, {value: state});
  }
  let id: string;
  do {
    id = `${prefix}-${(++state.next).toString(36)}`;
    // Callers use static CSS-safe prefixes and may derive field/option IDs by
    // appending suffixes. Skip a namespace already occupied by host markup.
  } while (doc.getElementById(id) || doc.querySelector(`[id^="${id}-"]`));
  return id;
}
