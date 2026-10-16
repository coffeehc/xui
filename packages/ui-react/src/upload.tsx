import * as React from 'react';
import {createUploadController, type UploadController, type UploadControllerOptions, type UploadFile, type UploadState} from '@coffeehc/xui-runtime/upload';
import {Button} from './button.js';
import {Field, Input} from './forms.js';
import {Badge, Progress} from './feedback.js';
import {cx, hasContent} from './shared.js';
import {useOwnedController, useViewRelease, assertControllerProps, type ControllerProps} from './controller.js';

export type {UploadController, UploadControllerOptions, UploadFile, UploadState} from '@coffeehc/xui-runtime/upload';
/** All visible/action/accessibility text can be localized without changing DOM or styles. */
export interface UploadLabels {
  select: string; drop: string; upload: string; cancel: string; remove: string; retry: string;
  queued: string; uploading: string; success: string; error: string; canceled: string; invalid: string;
  type: string; size: string; count: string; unknown: string; waiting: string; bytes: string;
}
const defaults: Readonly<UploadLabels> = Object.freeze({select: '选择文件', drop: '或将文件拖到此处', upload: '上传', cancel: '取消', remove: '移除', retry: '重新上传', queued: '待上传', uploading: '上传中', success: '已上传', error: '上传未确认', canceled: '已停止等待', invalid: '文件不可上传', type: '不支持此文件类型', size: '文件超过大小限制', count: '文件数量超出限制', unknown: '结果未确认，请先核对服务器；重新上传可能产生重复文件。', waiting: '等待服务器确认', bytes: '字节'});

/** Conditional actions keep focus inside their own row when the focused action disappears.
 * A real blur to another control/body clears ownership, so completion never steals outside focus. */
function FileActions<T>({file, owner, labels, locked, description, remove}: {file: UploadFile<T>; owner: UploadController<T>; labels: UploadLabels; locked: boolean; description: string; remove: () => void}) {
  const root = React.useRef<HTMLDivElement>(null), focused = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    const node = focused.current;
    if (node && !node.isConnected && document.activeElement === document.body) root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll: true});
  }, [file.status]);
  return <div ref={root} data-slot="fileActions" className="xui-upload-file-actions" onFocusCapture={event => { focused.current = event.target as HTMLElement; }} onBlurCapture={event => { if ((event.target as HTMLElement).isConnected && !event.currentTarget.contains(event.relatedTarget as Node)) focused.current = null; }}>
    {(file.status === 'uploading' || file.status === 'queued') && <Button size="sm" variant="ghost" disabled={locked} aria-label={`${labels.cancel} ${file.file.name}`} onClick={() => owner.cancel(file.id)}>{labels.cancel}</Button>}
    {(file.status === 'error' || file.status === 'canceled') && <Button size="sm" variant="outline" disabled={locked} aria-describedby={file.resultUnknown ? description : undefined} aria-label={`${labels.retry} ${file.file.name}`} onClick={() => owner.retry(file.id)}>{labels.retry}</Button>}
    <Button size="sm" variant="ghost" disabled={locked} aria-label={`${labels.remove} ${file.file.name}`} onClick={remove}>{labels.remove}</Button>
  </div>;
}
/** Slot content retains the library's layout/typography; actions and request state stay with its owner. */
export type UploadProps<T = unknown> = Omit<React.ComponentProps<'section'>, 'children' | 'title' | 'onChange'> & ControllerProps<UploadController<T>, {options: UploadControllerOptions<T>}> & {
  label: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** View-only gates do not reconfigure a borrowed Controller or cancel an existing request. */
  disabled?: boolean;
  readOnly?: boolean;
  labels?: Partial<UploadLabels>;
  /** Locale for the exact byte count, default zh-CN. No KB/MB rounding or inferred totals. */
  locale?: string;
  /** Secondary file metadata. Filenames, status and actions keep their fixed public slots. */
  renderFileMeta?: (file: UploadFile<T>) => React.ReactNode;
  /** Confirmed response content only; never called for pending/failed/removed records. */
  renderResult?: (file: UploadFile<T> & {response: NonNullable<UploadFile<T>['response']>}) => React.ReactNode;
};

/** Complete React upload field with an inert default Controller or a fully borrowed one.
 * File selection never starts a write; only Upload/retry does. UI does not invent progress. */
export function Upload<T = unknown>(props: UploadProps<T>) {
  const {controller: injected, options, label, description, error, required = false, disabled = false, readOnly = false, labels: overrides, locale = 'zh-CN', renderFileMeta, renderResult, className, ref, ...sectionProps} = props as UploadProps<T> & {controller?: UploadController<T>; options?: UploadControllerOptions<T>};
  assertControllerProps(injected, props, ['options']);
  if (!label?.trim()) throw new TypeError('Upload requires a label');
  const owner = useOwnedController(injected, () => { if (!options) throw new TypeError('Upload requires options or a controller'); return createUploadController(options); });
  const state = React.useSyncExternalStore(owner.subscribe, owner.getState, owner.getState);
  useViewRelease(owner, () => owner.cancel());
  const labels = {...defaults, ...overrides}, root = React.useRef<HTMLElement>(null), input = React.useRef<HTMLInputElement>(null), picker = React.useRef<HTMLButtonElement>(null), depth = React.useRef(0);
  const [dragging, setDragging] = React.useState(false), id = React.useId(), inputId = `${id}-input`, labelId = `${id}-label`, filesId = `${id}-files`;
  React.useImperativeHandle(ref, () => root.current!, []);
  const locked = disabled || readOnly || state.disabled || state.readOnly, hasFiles = state.files.some(file => file.status !== 'invalid');
  const fieldError = hasContent(error) ? error : state.selectionError ? labels[state.selectionError] : undefined;
  const describedBy = [hasContent(description) ? `${inputId}-help` : '', hasContent(fieldError) ? `${inputId}-error` : ''].filter(Boolean).join(' ') || undefined;
  React.useLayoutEffect(() => { if (locked) { depth.current = 0; setDragging(false); } }, [locked]);
  const selected = (files: Iterable<File>) => { if (!locked) owner.add(files); if (input.current) input.current.value = ''; };
  const recoverFocus = (id: string) => {
    const rows = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-upload-row]') ?? []), index = rows.findIndex(row => row.dataset.uploadRow === id), row = rows[index], held = !!row?.contains(document.activeElement);
    owner.remove(id);
    if (held) queueMicrotask(() => {
      const remaining = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-upload-row]') ?? []), next = remaining[index] ?? remaining[index - 1];
      if (document.activeElement === document.body || document.activeElement === row) (next?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? picker.current)?.focus({preventScroll: true});
    });
  };
  const fileDrag = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files');
  return <section {...sectionProps} ref={root} className={cx('xui-upload', className)} aria-labelledby={labelId} data-disabled={locked || undefined} data-readonly={readOnly || state.readOnly || undefined}>
    <Field label={<span id={labelId} data-slot="label">{label}</span>} controlId={inputId} required={required} help={description} error={fieldError}>
      <div data-slot="picker" className="xui-upload-picker" data-dragging={dragging || undefined}
        onDragEnter={event => { if (fileDrag(event)) { event.preventDefault(); if (!locked) { depth.current++; setDragging(true); } } }}
        onDragOver={event => { if (fileDrag(event)) { event.preventDefault(); event.dataTransfer.dropEffect = locked ? 'none' : 'copy'; } }}
        onDragLeave={event => { if (fileDrag(event) && depth.current > 0 && --depth.current === 0) setDragging(false); }}
        onDrop={event => { if (!fileDrag(event)) return; event.preventDefault(); depth.current = 0; setDragging(false); selected(Array.from(event.dataTransfer.files)); }}>
        <Input ref={input} className="xui-upload-input" type="file" tabIndex={-1} accept={state.accept || undefined} multiple={state.multiple} required={required && !hasFiles} disabled={locked} aria-readonly={readOnly || state.readOnly || undefined}
          aria-errormessage={hasContent(fieldError) ? `${inputId}-error` : undefined} onChange={event => selected(Array.from(event.target.files ?? []))} onInvalid={event => { event.preventDefault(); picker.current?.focus(); }} onFocus={() => picker.current?.focus()}/>
        <Button ref={picker} variant="outline" disabled={locked} aria-label={`${labels.select}：${label}`} aria-controls={filesId} aria-describedby={describedBy} aria-invalid={hasContent(fieldError) || undefined} onClick={() => input.current?.click()}>{labels.select}</Button>
        <span data-slot="hint" className="xui-help">{labels.drop}</span>
      </div>
    </Field>
    {<ul id={filesId} data-slot="list" className="xui-upload-list" aria-label={label}>
      {state.files.map(file => <li key={file.id} data-upload-row={file.id} data-slot="file" className="xui-upload-file">
        <div className="xui-upload-info"><span data-slot="filename" className="xui-upload-name">{file.file.name}</span><span data-slot="metadata" className="xui-help">{new Intl.NumberFormat(locale).format(file.file.size)} {labels.bytes}{renderFileMeta && <span>{renderFileMeta(file)}</span>}</span></div>
        <div data-slot="status" className="xui-upload-status" role="status"><Badge tone={file.status === 'success' ? 'success' : file.status === 'error' || file.status === 'invalid' ? 'error' : file.status === 'canceled' ? 'warning' : file.status === 'uploading' ? 'info' : 'neutral'}>{labels[file.status]}</Badge></div>
        {file.status === 'uploading' && <div data-slot="progress" className="xui-upload-progress"><Progress aria-label={`${labels.uploading} ${file.file.name}`}/><span className="xui-help">{labels.waiting}</span></div>}
        <FileActions file={file} owner={owner} labels={labels} locked={locked} description={`${id}-${file.id}-unknown`} remove={() => recoverFocus(file.id)}/>

        {file.validation && <p data-slot="feedback" className="xui-error">{labels[file.validation]}</p>}
        {file.resultUnknown && <p id={`${id}-${file.id}-unknown`} data-slot="feedback" className="xui-help">{labels.unknown}</p>}
        {file.status === 'success' && file.response && renderResult && <div data-slot="result" className="xui-upload-result">{renderResult(file as UploadFile<T> & {response: NonNullable<UploadFile<T>['response']>})}</div>}
      </li>)}
    </ul>}
    <div data-slot="actions" className="xui-upload-actions"><Button disabled={locked || state.busy || !state.files.some(file => file.status === 'queued')} aria-busy={state.busy} onClick={() => owner.start()}>{state.busy ? labels.uploading : labels.upload}</Button></div>
  </section>;
}
