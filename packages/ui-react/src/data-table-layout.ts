/**
 * @internal One geometry owner per rendered DataTable. Writes the body's track,
 * component minimum and no-records loading offset below the measured header.
 * Host heights, column sizing,
 * pagination and full-content document flow stay outside this owner.
 */
export function observeDataTableLayout(frame: HTMLElement, body: HTMLElement, table: HTMLTableElement) {
  const win = table.ownerDocument.defaultView;
  // Non-layout renderers (including server/test DOMs) need no geometry owner.
  if (!win || typeof table.offsetHeight !== 'number' || !frame.parentElement) return {update() {}, destroy() {}};
  const root = frame.parentElement, original = frame.style.gridTemplateRows, originalMinimum = root.style.minBlockSize;
  let dead = false, pending = 0, written: string | undefined, writtenMinimum: string | undefined;
  let positionedLoading: HTMLElement | undefined, originalLoadingMargin = '', writtenLoadingMargin = '';
  const restoreLoading = () => {
    if (positionedLoading?.style.marginBlockStart === writtenLoadingMargin) positionedLoading.style.marginBlockStart = originalLoadingMargin;
  };
  const watched = new Set<Element>();
  const number = (value: string) => Number.parseFloat(value) || 0;
  const measure = () => {
    if (dead || !table.offsetHeight) return;
    const head = table.tHead, rows = table.tBodies[0]?.rows;
    const loading = Array.from(frame.children).find(node => node.classList.contains('xui-data-table-loading')) as HTMLElement | undefined;
    const headHeight = head?.offsetHeight ?? 0;
    const headerSize = `${headHeight}px`;
    if (loading !== positionedLoading) {
      restoreLoading();positionedLoading = loading;originalLoadingMargin = loading?.style.marginBlockStart ?? '';
    }
    if (loading && loading.style.marginBlockStart !== headerSize) loading.style.marginBlockStart = headerSize;
    writtenLoadingMargin = headerSize;
    const style = win.getComputedStyle(body);
    const scrollbar = Math.max(0, body.offsetHeight - body.clientHeight - number(style.borderTopWidth) - number(style.borderBottomWidth));
    const clearance = number(style.scrollPaddingTop) + number(style.scrollPaddingBottom);
    // The centered layer follows the visible body, so its allocated height must
    // never feed back into the table's intrinsic minimum. Only its text/spinner
    // and padding contribute; long translated labels may increase that minimum.
    const loadingStyle = loading && win.getComputedStyle(loading);
    const loadingContent = loading ? Array.from(loading.children).reduce((height, node) => height + (node as HTMLElement).offsetHeight, 0) : 0;
    const loadingMinimum = loadingStyle ? loadingContent + Math.max(0, loading!.children.length - 1) * number(loadingStyle.rowGap) + number(loadingStyle.paddingTop) + number(loadingStyle.paddingBottom) : 0;
    const edgeHeight = Math.max(rows?.[0]?.offsetHeight ?? 0, rows?.[rows.length - 1]?.offsetHeight ?? 0, loadingMinimum);
    const contentHeight = Math.max(table.offsetHeight, headHeight + loadingMinimum) + scrollbar;
    const readableHeight = headHeight + edgeHeight + clearance + scrollbar;
    const minimum = Math.ceil(Math.min(contentHeight, readableHeight));
    if (!Number.isFinite(minimum) || minimum <= 0) return;
    // Read the component's actual chrome, never the allocated frame/body height
    // or a host header. Root/frame are outputs and are not observer targets.
    const frameStyle = win.getComputedStyle(frame);
    const chrome = Array.from(frame.children).reduce((height, node) => height + (node === body || node === loading ? 0 : (node as HTMLElement).offsetHeight), 0);
    const frameEdges = number(frameStyle.borderTopWidth) + number(frameStyle.borderBottomWidth) + number(frameStyle.paddingTop) + number(frameStyle.paddingBottom);
    const componentMinimum = Math.ceil(chrome + frameEdges + minimum);
    const rootMinimum = root.dataset.layout === 'document' ? originalMinimum : root.dataset.layout === 'workspace' ? `max(var(--data-table-min-block-size), ${componentMinimum}px)` : `${componentMinimum}px`;
    const tracks = `auto minmax(${minimum}px, 1fr) auto`;
    if (frame.style.gridTemplateRows !== tracks) frame.style.gridTemplateRows = tracks;
    if (root.style.minBlockSize !== rootMinimum) root.style.minBlockSize = rootMinimum;
    written = tracks;
    writtenMinimum = rootMinimum;
  };
  const schedule = () => {
    if (!dead && !pending) pending = win.requestAnimationFrame(() => { pending = 0; measure(); });
  };
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  const update = () => {
    if (dead) return;
    const rows = table.tBodies[0]?.rows;
    const targets = new Set<Element>([...Array.from(frame.children).filter(node => !node.classList.contains('xui-data-table-loading')), table]);
    const loading = Array.from(frame.children).find(node => node.classList.contains('xui-data-table-loading'));
    if (loading) for (const node of Array.from(loading.children)) targets.add(node);
    if (table.tHead) targets.add(table.tHead);
    if (rows?.length) { targets.add(rows[0]); targets.add(rows[rows.length - 1]); }
    for (const node of watched) if (!targets.has(node)) { observer?.unobserve(node); watched.delete(node); }
    for (const node of targets) if (!watched.has(node)) { observer?.observe(node); watched.add(node); }
    schedule();
  };
  win.addEventListener('resize', schedule);
  update();
  return {
    update,
    destroy() {
      if (dead) return;
      dead = true;
      observer?.disconnect();
      watched.clear();
      win.cancelAnimationFrame(pending);
      win.removeEventListener('resize', schedule);
      if (written !== undefined && frame.style.gridTemplateRows === written) frame.style.gridTemplateRows = original;
      if (writtenMinimum !== undefined && root.style.minBlockSize === writtenMinimum) root.style.minBlockSize = originalMinimum;
      restoreLoading();positionedLoading = undefined;
    },
  };
}
