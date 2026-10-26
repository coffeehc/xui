import * as React from 'react';
import {createModelProfileController, modelProfileStoredKey, modelProfileProviders, type ModelProfileController, type ModelProfileControllerOptions, type ModelProfileConfig, type ModelProfileState, type ModelProfileField, type ModelProfileCommittedSave} from '@coffeehc/xui-runtime/model-profile';
import {createPasswordInputController} from '@coffeehc/xui-runtime/display';
import {Button} from './button.js';
import {Field, Fieldset, Input, Textarea, SimpleSelect, Checkbox} from './forms.js';
import {PasswordInput, type PasswordInputHandle} from './text-inputs.js';
import {FormGrid, FormActions, Stack} from './layout.js';
import {Combobox} from './combobox.js';
import {Disclosure} from './navigation.js';
import {Alert, LoadingState, Spinner} from './feedback.js';
import {Sheet} from './sheet.js';
import {AlertDialog} from './alert-dialog.js';
import {Toast, type ToastController} from './toast.js';
import {useOwnedController, useViewRelease, assertControllerProps, type ControllerProps} from './controller.js';
import {cx} from './shared.js';
export type {ModelProfileController, ModelProfileControllerOptions} from '@coffeehc/xui-runtime/model-profile';

export const modelProfileLabels = {
  title: '模型配置', identity: '模型与协议', connection: '连接', settings: '运行参数', capabilities: '模型能力', policy: '默认策略', advanced: '高级配置',
  model_name: '模型名称', provider_type: 'Provider 类型', real_name: '真实模型名', base_url: 'Base URL', api_key: 'API Key', headers: '请求 Headers',
  timeout_seconds: '首字超时（秒，0 为协议默认）', max_concurrency: '最大并发数（-1 为无限制）',
  supports_chat: '聊天', supports_tool_calls: '工具调用', supports_vision: '视觉', supports_audio: '音频', supports_files: '文件', supports_image_generation: '图片生成', supports_embedding: '文本向量',
  contextTokens: '上下文 tokens', outputTokens: '最大输出 tokens', reasoning: '推理强度', providerDefault: '协议默认',
  contextMissing: '未配置，请填写', notSpecified: '未指定',
  default_policy: '策略 JSON', headersJSON: 'Headers JSON',
  configured: '已配置', notConfigured: '未配置', keyPlaceholder: '输入新的 API Key', showKey: '显示 API Key', hideKey: '隐藏 API Key',
  catalog: '拉取模型目录', catalogEmpty: '目录为空，可手动输入模型名', catalogIdle: '可手动输入，或拉取目录后选择', catalogUnsupported: '此协议需手动输入模型名',
  test: '测试连接', save: '保存模型', reset: '重置草稿', cancel: '停止等待', reload: '重新读取', close: '关闭', loading: '正在读取配置…',
  tooLong: '测试文本最多 16384 个字符。', required: '请填写此项。', url: '请输入不含账号、查询参数或锚点的 HTTP(S) 地址。', integer: '请输入符合范围的整数。', json: '请输入有效的 JSON 对象或 null。', credentials: '请输入新密钥或留空；****** 仅适用于已有密钥。',
  loadError: '无法读取配置，请重试。', catalogError: '模型目录读取失败，可重试或手动输入。', testError: '未取得测试结果，请检查连接后重试。', saveError: '保存被拒绝，请检查配置或重新读取最新版本。', unknown: '保存结果未知。请先核对后端记录，不要重复保存。',
  savedTestFailed: '模型已保存，但测试未通过。请检查配置后修改。', savedCompletionFailed: '模型已保存，但后续处理未完成。请核对状态，不要重复保存。', savedBothFailed: '模型已保存，但测试未通过，后续处理也未完成。请核对状态。', savedReload: '配置已保存。重新读取确认当前版本后才能继续编辑。',
  saved: '模型已保存', tested: '测试通过', testFailed: '测试未通过', result: '最近测试结果', elapsed: '耗时（毫秒）', vectorCount: '向量数量', dimensions: '向量维度',
  embedding: '向量测试', embeddingInput: '测试文本', embeddingDimensions: '请求维度（可选）', closeDirty: '关闭会丢弃未保存的草稿。', unsaved: '尚未保存的修改', keepEditing: '继续编辑', discard: '放弃并关闭', closeSaving: '保存已经发出，停止等待不能撤销保存。请在关闭后重新核对记录。',
} as const;
export type ModelProfileLabels = {[K in Exclude<keyof typeof modelProfileLabels, 'contextMissing' | 'notSpecified'>]: string} & {contextMissing?: string; notSpecified?: string};
export interface ModelProfileSlotContext {controller: ModelProfileController; state: Readonly<ModelProfileState>}
/** Extensions occupy their assigned region and borrow the same draft owner. */
export interface ModelProfileSlots {
  afterConnection?: (context: ModelProfileSlotContext) => React.ReactNode;
  advanced?: (context: ModelProfileSlotContext) => React.ReactNode;
  actions?: (context: ModelProfileSlotContext) => React.ReactNode;
  result?: (context: ModelProfileSlotContext) => React.ReactNode;
}
type Presentation = {
  labels?: Partial<ModelProfileLabels>;
  slots?: ModelProfileSlots;
  disabled?: boolean;
  readOnly?: boolean;
  /** Called for a confirmed saved projection, including a save with failed verification. */
  onSaved?: (data: NonNullable<ModelProfileState['data']>) => void;
  /** Every confirmed commit, even when no safe editor projection is available. Refresh the host list here. */
  onCommitted?: (receipt: Readonly<ModelProfileCommittedSave>) => void;
  /** A host may supply its existing queue. No page-flow success banner is created. */
  toastController?: ToastController;
  className?: string;
};
export type ModelProfileFormProps = Presentation & ControllerProps<ModelProfileController, {options?: ModelProfileControllerOptions}>;

/** Same reusable form in a page, Card or Sheet. Read/test/save happen only through its Controller. */
export function ModelProfileForm(props: ModelProfileFormProps) {
  assertControllerProps(props.controller, props, ['options']);
  const controller = useOwnedController(props.controller, () => createModelProfileController(props.options));
  const content = <ModelProfileFields {...props} controller={controller}/>;
  return props.toastController ? <Toast.Provider controller={props.toastController}>{content}</Toast.Provider> : <Toast.Provider>{content}<Toast.View/></Toast.Provider>;
}
function ModelProfileFields({controller, labels: overrides, slots, disabled: viewDisabled = false, readOnly: viewReadOnly = false, onSaved, onCommitted, className}: Presentation & {controller: ModelProfileController}) {
  const state = React.useSyncExternalStore(controller.subscribe, controller.getState, controller.getState), labels = {...modelProfileLabels, ...overrides};
  const activeOwner = React.useRef(controller); activeOwner.current = controller;
  const root = React.useRef<HTMLFormElement>(null), key = React.useRef<HTMLInputElement>(null), keyControl = React.useRef<PasswordInputHandle>(null), headers = React.useRef<HTMLTextAreaElement>(null);
  const keyVisibility = useOwnedController(undefined, () => createPasswordInputController());
  const keyMask = state.data?.has_api_key ? modelProfileStoredKey : '';
  const [advanced, setAdvanced] = React.useState(false), id = React.useId(), toast = Toast.useToastManager();
  const apiMode = state.apiKeyMode, headersMode = state.headersMode, latestModes = React.useRef({apiMode, headersMode}); latestModes.current = {apiMode, headersMode};
  React.useEffect(() => {if (!controller.getState().data && !controller.getState().operation) void controller.load();}, [controller]);
  React.useLayoutEffect(() => controller.bindCredentials(() => ({...(latestModes.current.apiMode === 'replace' ? {api_key: key.current?.value ?? ''} : {}), ...(latestModes.current.headersMode === 'replace' ? {headers: JSON.parse(headers.current?.value ?? '{}')} : {})})), [controller]);
  React.useLayoutEffect(() => {
    if (apiMode !== 'replace') {keyControl.current?.clear(); if (key.current && apiMode === 'keep') {key.current.value = keyMask; keyVisibility.setVisible(!!keyMask);}}
  }, [controller, state.credentialRevision, apiMode, keyMask, keyVisibility]);
  React.useLayoutEffect(() => {if (headersMode !== 'replace' && headers.current) headers.current.value = '{}';}, [controller, state.credentialRevision, headersMode]);
  useViewRelease(controller, () => {if (activeOwner.current === controller) {keyControl.current?.clear(); if (headers.current) headers.current.value = '';} controller.clear();});
  const disabled = state.disabled || viewDisabled, readOnly = state.readOnly || viewReadOnly;
  const needsRead = state.saveReceipt?.status === 'committed' && !state.saveReceipt.editor;
  const draft = state.draft, busy = !!state.operation, locked = disabled || readOnly || needsRead || state.operation === 'save' || state.operation === 'load';
  const context = {controller, state};
  const issue = (field: ModelProfileField) => state.errors[field] ? labels[state.errors[field]!] : undefined;
  const focusError = () => {const current = controller.getState(); if (current.errors.default_policy || current.errors.headers) setAdvanced(true); requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]:is(input,textarea,button,select)')?.focus());};
  const action = async (operation: 'save' | 'test' | 'catalog') => {
    const previous = controller.getState();
    const receipt = await controller[operation](); if (activeOwner.current !== controller || !root.current?.isConnected) return; const current = controller.getState();
    if (operation === 'save' && !receipt && current.data !== previous.data) return;
    focusError();
    if (current.error) {if (current.error !== 'save_unknown') toast.add({description: ({load: labels.loadError, catalog: labels.catalogError, test: labels.testError, save: labels.saveError})[current.error], type: 'error'}); return;}
    if (Object.keys(current.errors).length || current.operation) return;
    if (operation === 'save' && receipt?.status === 'committed' && current.saveReceipt === receipt) {
      const failed = receipt.test_failed || receipt.completion_failed;
      toast.add({description: receipt.test_failed && receipt.completion_failed ? labels.savedBothFailed : receipt.test_failed ? labels.savedTestFailed : receipt.completion_failed ? labels.savedCompletionFailed : labels.saved, type: failed ? 'error' : 'success'});
      // Observer failures cannot convert an authoritative commit into an unknown/retryable write.
      try {onCommitted?.(receipt);} catch {/* Host observer owns its failure. */}
      if (receipt.editor && controller.getState().saveReceipt === receipt) try {onSaved?.(receipt.editor);} catch {/* Host observer owns its failure. */}
    }
    if (operation === 'test' && current.testResult && current.testResult !== previous.testResult) toast.add({description: current.testResult.passed ? labels.tested : labels.testFailed, type: current.testResult.passed ? 'success' : 'error'});
  };
  if (!draft) return <Stack className={className}>{state.error ? <Alert tone="error">{labels.loadError}<Button onClick={() => void controller.load()}>{labels.reload}</Button></Alert> : <LoadingState>{labels.loading}</LoadingState>}</Stack>;
  const provider = modelProfileProviders.find(item => item.id === draft.provider_type)!, chat = provider.kind === 'chat', embedding = provider.kind === 'embedding';
  const field = (name: 'model_name' | 'base_url') => <Field label={labels[name]} required error={issue(name)}><Input value={draft[name]} disabled={disabled} readOnly={locked} onChange={event => controller.setField(name, event.target.value)}/></Field>;
  let policyInvalid = false; try {JSON.parse(state.policyText);} catch {policyInvalid = true;}
  const policy = draft.default_policy ?? {}, requiredPolicyFields = state.requiredPolicyFields ?? [];
  const policyNumber = (name: 'max_context_tokens' | 'max_completion_tokens', label: string) => {
    const value = policy[name], invalidContext = name === 'max_context_tokens' && typeof value === 'number' && (!Number.isSafeInteger(value) || value <= 0);
    return <Field label={label} required={requiredPolicyFields.includes(name)} error={issue(name)} help={invalidContext ? labels.contextMissing : undefined}><Input type="number" min={1} step={1} placeholder={name === 'max_context_tokens' ? labels.contextMissing : labels.notSpecified} value={typeof value === 'number' ? value : ''} disabled={locked || policyInvalid} onChange={event => {const next = {...policy}; if (event.target.value === '') delete next[name]; else next[name] = Number(event.target.value); controller.setField('default_policy', next);}}/></Field>;
  };
  const errorMessage = state.error ? ({load: labels.loadError, catalog: labels.catalogError, test: labels.testError, save: labels.saveError, save_unknown: labels.unknown})[state.error] : null;
  return <form ref={root} className={cx('xui-model-profile', className)} aria-label={labels.title} noValidate onSubmit={event => {event.preventDefault(); if (!busy && !locked) void action('save');}}>
    <Fieldset legend={labels.identity} layout="stack"><FormGrid>
      {field('model_name')}
      <Field label={labels.provider_type} required><SimpleSelect value={draft.provider_type} disabled={locked} onChange={event => controller.setField('provider_type', event.target.value as ModelProfileConfig['provider_type'])}>{modelProfileProviders.filter(item => state.data!.defaults.some(config => config.provider_type === item.id)).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</SimpleSelect></Field>
      <FormGrid.Item span="full"><Field label={labels.real_name} required controlId={`${id}-model`} error={issue('real_name')}>
        <div className="xui-model-profile-catalog">
          <Combobox.Root items={(state.catalog ?? []).map(item => item.id)} value={draft.real_name || null} inputValue={draft.real_name} disabled={locked} onInputValueChange={value => controller.setField('real_name', value)} onValueChange={value => {if (value) controller.setField('real_name', value);}}>
            <Combobox.Input id={`${id}-model`} aria-required="true" aria-invalid={!!issue('real_name')} aria-describedby={issue('real_name') ? `${id}-model-error` : undefined}/>
            <Combobox.Content><Combobox.Empty>{state.catalog ? labels.catalogEmpty : labels.catalogIdle}</Combobox.Empty><Combobox.List>{(value: string) => <Combobox.Item key={value} value={value}>{value}</Combobox.Item>}</Combobox.List></Combobox.Content>
          </Combobox.Root>
          <Button type="button" variant="outline" disabled={locked || busy || !provider.catalog} aria-busy={state.operation === 'catalog'} onClick={() => void action('catalog')}>{state.operation === 'catalog'&&<Spinner/>}{labels.catalog}</Button>
        </div>
        {!provider.catalog && <span className="xui-help">{labels.catalogUnsupported}</span>}
      </Field></FormGrid.Item>
    </FormGrid></Fieldset>
    <Fieldset legend={labels.connection} layout="stack"><FormGrid>
      {field('base_url')}
      <Field label={labels.api_key} error={issue('api_key')}><PasswordInput ref={key} controlRef={keyControl} controller={keyVisibility} disabled={disabled} readOnly={locked} placeholder={labels.keyPlaceholder} showLabel={labels.showKey} hideLabel={labels.hideKey} autoComplete="off"
        onFocus={event => {if (apiMode === 'keep') event.currentTarget.select();}}
        onClick={event => {if (apiMode === 'keep') event.currentTarget.select();}}
        onInput={event => {const value = event.currentTarget.value; if (value === keyMask && keyMask) controller.setCredentialMode('api_key', 'keep'); else {if (apiMode === 'keep') keyVisibility.hide(); controller.setCredentialMode('api_key', value ? 'replace' : 'clear');}}}/></Field>
    </FormGrid>{slots?.afterConnection?.(context)}</Fieldset>
    <Fieldset legend={labels.settings} layout="stack"><FormGrid>
      {(['timeout_seconds','max_concurrency'] as const).map(name => <Field key={name} label={labels[name]} error={issue(name)}><Input type="number" min={name === 'timeout_seconds' ? 0 : -1} step={1} value={Number.isNaN(draft[name]) ? '' : draft[name]} disabled={disabled} readOnly={locked} onChange={event => controller.setField(name, event.target.value === '' ? NaN : Number(event.target.value))}/></Field>)}
    </FormGrid></Fieldset>
    {chat && <Fieldset legend={labels.capabilities}><div className="xui-model-profile-capabilities">{(['supports_chat','supports_tool_calls','supports_vision','supports_audio','supports_files'] as const).map(name => <Checkbox key={name} label={labels[name]} checked={!!draft.capabilities[name]} disabled={locked} onChange={event => controller.setField('capabilities', {...draft.capabilities, [name]: event.target.checked})}/>)}</div></Fieldset>}
    {chat && <Fieldset legend={labels.policy} layout="stack"><FormGrid>{policyNumber('max_context_tokens', labels.contextTokens)}{policyNumber('max_completion_tokens', labels.outputTokens)}<Field label={labels.reasoning} required={requiredPolicyFields.includes('reasoning_effort')} error={issue('reasoning_effort')}><SimpleSelect value={typeof policy.reasoning_effort === 'string' ? policy.reasoning_effort : ''} disabled={locked || policyInvalid} onChange={event => {const next = {...policy}; if (!event.target.value) delete next.reasoning_effort; else next.reasoning_effort = event.target.value; controller.setField('default_policy', next);}}><option value="">{labels.notSpecified}</option>{['none','minimal','low','medium','high','xhigh'].map(value => <option key={value} value={value}>{value}</option>)}{typeof policy.reasoning_effort === 'string' && !['none','minimal','low','medium','high','xhigh'].includes(policy.reasoning_effort) && <option value={policy.reasoning_effort}>{policy.reasoning_effort}</option>}</SimpleSelect></Field></FormGrid></Fieldset>}
    {embedding && <Fieldset legend={labels.embedding} layout="stack"><FormGrid><Field label={labels.embeddingInput} error={issue('embedding_input')}><Input value={state.embeddingInput} disabled={disabled} readOnly={locked} onChange={event => controller.setEmbeddingTest(event.target.value, state.embeddingDimensions)}/></Field><Field label={labels.embeddingDimensions} error={issue('embedding_dimensions')}><Input type="number" min={1} step={1} value={state.embeddingDimensions} disabled={disabled} readOnly={locked} onChange={event => controller.setEmbeddingTest(state.embeddingInput, event.target.value)}/></Field></FormGrid></Fieldset>}
    <Disclosure title={labels.advanced} open={advanced} onOpenChange={setAdvanced}><Stack>
      <Field label={labels.headersJSON} help={state.data!.header_names.join(', ') || undefined} error={issue('headers')}><Textarea ref={headers} rows={3} defaultValue="{}" disabled={disabled} readOnly={locked} onInput={() => controller.setCredentialMode('headers', 'replace')}/></Field>
      {!embedding && <Field label={labels.default_policy} error={issue('default_policy')}><Textarea rows={5} value={state.policyText} disabled={disabled} readOnly={locked} onChange={event => controller.setPolicyText(event.target.value)}/></Field>}
      {slots?.advanced?.(context)}
    </Stack></Disclosure>
    {state.testResult && <Disclosure title={labels.result}><div className="xui-model-profile-result" role="status">{slots?.result ? slots.result(context) : <><strong>{state.testResult.passed ? labels.tested : labels.testFailed}</strong><p>{state.testResult.summary}</p><dl><dt>{labels.elapsed}</dt><dd>{state.testResult.elapsed_ms}</dd>{state.testResult.embedding && <><dt>{labels.vectorCount}</dt><dd>{state.testResult.embedding.count}</dd><dt>{labels.dimensions}</dt><dd>{state.testResult.embedding.dimensions}</dd></>}</dl></>}</div></Disclosure>}
    {(state.error === 'save_unknown' || needsRead) && <Alert tone="error">{needsRead ? labels.savedReload : errorMessage}{(state.saveReceipt?.profile_id || state.data!.profile_id) && <Button type="button" variant="text" onClick={() => void controller.load()}>{labels.reload}</Button>}</Alert>}
    <FormActions secondary={<><Button type="button" variant="text" disabled={locked || busy || !state.dirty || state.error === 'save_unknown'} onClick={() => controller.reset()}>{labels.reset}</Button>{slots?.actions?.(context)}</>}>
      <Button type="button" variant="outline" disabled={locked || busy} aria-busy={state.operation === 'test'} onClick={() => void action('test')}>{state.operation === 'test'&&<Spinner/>}{labels.test}</Button>
      {busy && <Button type="button" variant="text" onClick={() => controller.cancel()}>{labels.cancel}</Button>}
      <Button type="submit" disabled={locked || busy || !state.data!.can_save || state.error === 'save_unknown' || state.saveReceipt?.status === 'committed' && !state.dirty} aria-busy={state.operation === 'save'}>{state.operation === 'save'&&<Spinner/>}{labels.save}</Button>
    </FormActions>
  </form>;
}

export type ModelProfileEditorProps = ModelProfileFormProps & {open: boolean; onOpenChange: (open: boolean) => void; title?: React.ReactNode; trigger?: React.ReactElement; finalFocus?: React.ComponentProps<typeof Sheet.Content>['finalFocus']};
/** Sheet borrows the same form owner; closing an edited draft requires an explicit discard. */
export function ModelProfileEditor({open, onOpenChange, title, trigger, finalFocus, ...props}: ModelProfileEditorProps) {
  assertControllerProps(props.controller, props, ['options']);
  const controller = useOwnedController(props.controller, () => createModelProfileController(props.options));
  const labels = {...modelProfileLabels, ...props.labels}, [confirmation, setConfirmation] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement>(null), discarding = React.useRef(false);
  const state = React.useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  React.useLayoutEffect(() => {if (!open) {setConfirmation(false); controller.clear();}}, [open, controller]);
  const changeOpen = (next: boolean) => {
    if (!next && (state.dirty || state.operation === 'save' || state.error === 'save_unknown')) {discarding.current = false; setConfirmation(true);}
    else onOpenChange(next);
  };
  const {options: _options, controller: _controller, ...presentation} = props;
  return <Sheet.Root open={open} onOpenChange={changeOpen}>{trigger && <Sheet.Trigger render={trigger}/>}
    <Sheet.Content finalFocus={finalFocus}><Sheet.Header closeButtonProps={{ref: closeRef, 'aria-label': labels.close}}><Sheet.Title>{title ?? labels.title}</Sheet.Title></Sheet.Header><Sheet.Body>
      <ModelProfileForm {...presentation} controller={controller}/>
      <AlertDialog.Root open={confirmation} onOpenChange={setConfirmation}><AlertDialog.Content finalFocus={() => discarding.current ? false : closeRef.current}>
        <AlertDialog.Title>{labels.unsaved}</AlertDialog.Title><AlertDialog.Description>{state.operation === 'save' || state.error === 'save_unknown' ? labels.closeSaving : labels.closeDirty}</AlertDialog.Description>
        <AlertDialog.Footer><AlertDialog.Close render={<Button variant="outline"/>}>{labels.keepEditing}</AlertDialog.Close><AlertDialog.Close render={<Button tone="danger"/>} onClick={() => {discarding.current = true; onOpenChange(false);}}>{labels.discard}</AlertDialog.Close></AlertDialog.Footer>
      </AlertDialog.Content></AlertDialog.Root>
    </Sheet.Body></Sheet.Content>
  </Sheet.Root>;
}
