import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import { Button as BaseButton } from '@base-ui/react/button';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { createToastController, type ToastContent, type ToastController as RuntimeToastController, type ToastOptions, type ToastRecord, type ToastViewBinding } from '@coffeehc/xui-runtime/toast';
import { useOwnedController, assertControllerProps } from './controller.js';
import { cx, branded, hasContent } from './shared.js';
export interface ToastPayload<Data extends object = Record<string, unknown>> extends ToastContent {
    title?: React.ReactNode;
    description?: React.ReactNode;
    data?: Data;
    ref?: React.RefObject<HTMLElement | null>;
    actionProps?: React.ComponentPropsWithoutRef<'button'>;
    positionerProps?: Omit<React.ComponentProps<typeof BasePopover.Positioner>, 'children'>;
}
export type ToastObject<Data extends object = Record<string, unknown>> = ToastRecord<ToastPayload<Data>>;
export type ToastController<Data extends object = Record<string, unknown>> = RuntimeToastController<ToastPayload<Data>>;
type AnyController = ToastController<any>;
type Context = {
    controller: AnyController;
    state: ReturnType<AnyController['getState']>;
    binding: React.RefObject<ToastViewBinding | null>;
    nodes: React.RefObject<Map<string, HTMLElement>>;
    returnFocus: React.RefObject<HTMLElement | null>;
    focusedId: React.RefObject<string | null>;
};
const ToastContext = React.createContext<Context | null>(null);
const PortalTargetContext = React.createContext<HTMLElement | ShadowRoot | null>(null);
const ItemContext = React.createContext<{
    toast: ToastObject<any>;
    titleId: string | undefined;
    descriptionId: string | undefined;
    defaultTitleId: string;
    defaultDescriptionId: string;
    setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
} | null>(null);
function useToastContext() { const value = React.useContext(ToastContext); if (!value)
    throw new Error('Toast parts require Toast.Provider'); return value; }
function useToastItemContext() { const value = React.useContext(ItemContext); if (!value)
    throw new Error('Toast item parts require Toast.Root'); return value; }
export type ToastProviderProps = ({
    controller: AnyController;
    toastManager?: never;
    timeout?: never;
    limit?: never;
    exitTimeout?: never;
} | {
    controller?: never;
    toastManager: AnyController;
    timeout?: never;
    limit?: never;
    exitTimeout?: never;
} | ({
    controller?: undefined;
    toastManager?: undefined;
} & ToastOptions)) & {
    children?: React.ReactNode;
};
/** One semantic queue, either owned by this Provider or wholly supplied by its host. */
function Provider({ controller: provided, toastManager, children, ...options }: ToastProviderProps) {
    if (provided && toastManager)
        throw new TypeError('Toast controller and toastManager are mutually exclusive');
    const injected = provided ?? toastManager;
    assertControllerProps(injected, options, ['timeout', 'limit', 'exitTimeout']);
    const controller = useOwnedController(injected, () => createToastController<ToastPayload<any>>(options));
    const state = React.useSyncExternalStore(controller.subscribe, controller.getState, controller.getState), binding = React.useRef<ToastViewBinding | null>(null), nodes = React.useRef(new Map<string, HTMLElement>()), returnFocus = React.useRef<HTMLElement | null>(null), focusedId = React.useRef<string | null>(null);
    React.useLayoutEffect(() => {
        const lease = controller.bindView();
        binding.current = lease;
        const visibility = () => lease.setPaused('document-hidden', document.hidden), blur = () => lease.setPaused('window-blur', true), focus = () => lease.setPaused('window-blur', false);
        visibility();
        lease.setPaused('window-blur', !document.hasFocus());
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('blur', blur);
        window.addEventListener('focus', focus);
        return () => {
            const hadFocus = focusedId.current !== null, target = returnFocus.current;
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('blur', blur);
            window.removeEventListener('focus', focus);
            lease.release();
            if (binding.current === lease)
                binding.current = null;
            if (hadFocus)
                queueMicrotask(() => { if (document.activeElement === document.body && target?.isConnected)
                    target.focus({ preventScroll: true }); });
        };
    }, [controller]);
    const {timeout, limit, exitTimeout} = options;
    React.useLayoutEffect(() => {if (!injected) controller.configure({timeout, limit, exitTimeout});}, [controller, injected, timeout, limit, exitTimeout]);
    const value = React.useMemo(() => ({ controller, state, binding, nodes, returnFocus, focusedId }), [controller, state]);
    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
function useToastManager<Data extends object = Record<string, unknown>>() {const {controller: untyped, state} = useToastContext(), controller = untyped as ToastController<Data>; return React.useMemo(() => ({...controller, toasts: state.toasts as readonly ToastObject<Data>[]}), [controller, state]);}
/** Compatibility spelling now creates the same xui queue that Provider can fully replace. */
function createToastManager<Data extends object = Record<string, unknown>>(options: ToastOptions = {}): ToastController<Data> { return createToastController<ToastPayload<Data>>(options); }
type PartProps<Tag extends React.ElementType, State extends object> = Omit<useRender.ComponentProps<Tag, State>, 'className' | 'style'> & {
    className?: string | ((state: State) => string | undefined);
    style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined);
};
function usePart<Tag extends keyof React.JSX.IntrinsicElements, State extends Record<string, unknown>>(tag: Tag, props: PartProps<Tag, State>, state: State, base: string, internal: Record<string, unknown> = {}) {
    const { className, style, render, ref, ...rest } = props;
    return useRender({ defaultTagName: tag, render, ref: ref as React.Ref<Element>, state, props: mergeProps(internal, { ...rest, className: cx(base, typeof className === 'function' ? className(state) : className), style: typeof style === 'function' ? style(state) : style }) });
}
const focusable = (root: HTMLElement) => root.querySelector<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') ?? root;
function restoreAfterClose(value: Pick<Context, 'controller' | 'nodes' | 'returnFocus'>, id: string) {
    const root = value.nodes.current.get(id);
    if (!root?.contains(root.ownerDocument.activeElement))
        return;
    const queue = value.controller.getState();
    const next = queue.toasts.find(item => item.id !== id && item.transitionStatus !== 'ending' && (!item.limited || queue.expanded));
    const node = next && value.nodes.current.get(next.id);
    if (node) {
        focusable(node).focus({ preventScroll: true });
        return;
    }
    const target = value.returnFocus.current;
    if (target?.isConnected)
        target.focus({ preventScroll: true });
    else
        (root.ownerDocument.activeElement as HTMLElement | null)?.blur();
}
export type ToastViewportState = {
    expanded: boolean;
};
export type ToastViewportProps = PartProps<'div', ToastViewportState>;
function Viewport({ ref, ...props }: ToastViewportProps) {
    const {controller, state, returnFocus} = useToastContext(), local = React.useRef<HTMLDivElement | null>(null), lease = React.useRef<ToastViewBinding | null>(null), focusWithin = React.useRef(false);
    React.useLayoutEffect(() => {
        const node = local.current;
        if (!node)
            return;
        const binding = controller.bindView();
        lease.current = binding;
        const activeElement=node.ownerDocument.activeElement;
        if(node.contains(activeElement)||activeElement!==node.ownerDocument.body)focusWithin.current=node.contains(activeElement);
        binding.setPaused('focus', focusWithin.current);
        binding.setPaused('hover', node.matches(':hover'));
        binding.setExpanded(node.contains(node.ownerDocument.activeElement) || node.matches(':hover'));
        const doc = node.ownerDocument, win = doc.defaultView!;
        // The declared 48rem layout boundary uses the actual reading size, including root zoom.
        const presentation = () => { const rootStyle = getComputedStyle(doc.documentElement); binding.setVisibleLimit(win.innerWidth / parseFloat(rootStyle.fontSize) <= 48 || parseFloat(rootStyle.getPropertyValue('--font-scale')) > 1 ? 1 : undefined); };
        presentation();
        const observer = new MutationObserver(presentation);
        observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-interface-scale'] });
        win.addEventListener('resize', presentation);
        const hotkey = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.key !== 'F6' || event.ctrlKey || event.altKey || event.metaKey)
                return;
            const active = doc.activeElement as HTMLElement | null;
            if (active?.closest('.xui-toast-viewport') && !node.contains(active))
                return;
            const available = Array.from(node.querySelectorAll<HTMLElement>('.xui-toast')).filter(root => !root.hasAttribute('data-ending-style') && (!root.hasAttribute('data-limited') || controller.getState().expanded));
            if (!available.length)
                return;
            event.preventDefault();
            if (node.contains(active) && returnFocus.current?.isConnected)
                returnFocus.current.focus({ preventScroll: true });
            else {
                returnFocus.current = active;
                node.focus();
            }
        };
        doc.addEventListener('keydown', hotkey);
        return () => {const hadFocus = focusWithin.current, target = returnFocus.current; observer.disconnect(); win.removeEventListener('resize', presentation); doc.removeEventListener('keydown', hotkey); binding.release(); if(hadFocus)queueMicrotask(()=>{if(doc.activeElement===doc.body&&target?.isConnected)target.focus({preventScroll:true});}); if (lease.current === binding)
            lease.current = null; };
    }, [controller, returnFocus]);
    React.useLayoutEffect(()=>{if(state.toasts.length||!focusWithin.current)return;const node=local.current,target=returnFocus.current;queueMicrotask(()=>{if((document.activeElement===document.body||document.activeElement===node)&&target?.isConnected)target.focus({preventScroll:true});});},[state.toasts.length,returnFocus]);
    return usePart('div', { ...props, ref: [ref, local] as unknown as React.Ref<HTMLDivElement> }, { expanded: state.expanded }, 'xui-layer xui-toast-viewport', {
        role: 'region', 'aria-label': 'Notifications', tabIndex: -1, 'data-expanded': state.expanded ? '' : undefined,
        onPointerEnter: () => { lease.current?.setPaused('hover', true); lease.current?.setExpanded(true); },
        onPointerLeave: () => { lease.current?.setPaused('hover', false); if (!local.current?.contains(document.activeElement))
            lease.current?.setExpanded(false); },
        onFocusCapture: (event: React.FocusEvent) => { focusWithin.current=true; if (event.relatedTarget instanceof HTMLElement && !local.current?.contains(event.relatedTarget))
            returnFocus.current = event.relatedTarget; lease.current?.setPaused('focus', true); lease.current?.setExpanded(true); },
        onBlurCapture: (event: React.FocusEvent) => { if (!local.current?.contains(event.relatedTarget as Node)) {
            if(event.relatedTarget!==null&&event.relatedTarget!==document.body)focusWithin.current=false;
            lease.current?.setPaused('focus', false);
            if (!local.current?.matches(':hover'))
                lease.current?.setExpanded(false);
        } },
    });
}
export type ToastRootState = {
    transitionStatus: 'starting' | 'ending' | undefined;
    expanded: boolean;
    limited: boolean;
    type: string | undefined;
    swiping: boolean;
    swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
};
export type ToastRootProps = PartProps<'div', ToastRootState> & {
    toast: ToastObject<any>;
    swipeDirection?: 'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[];
};
function swipeDirectionFor(x: number, y: number): NonNullable<ToastRootState['swipeDirection']> {
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}
/** Only gesture measurements live here. The queue and pause reasons stay in the Controller. */
function useToastSwipe(owner: Pick<Context, 'controller' | 'nodes' | 'returnFocus'>, id: string, enabled: boolean, phase: ToastRootState['transitionStatus'], node: React.RefObject<HTMLDivElement | null>, binding: React.RefObject<ToastViewBinding | null>, directions: NonNullable<ToastRootState['swipeDirection']>[]) {
  const {controller} = owner;
  const [movement, setMovement] = React.useState({x: 0, y: 0, direction: undefined as ToastRootState['swipeDirection']});
  const gesture = React.useRef<{id: number; x: number; y: number; binding: ToastViewBinding | null} | null>(null);
  const cancel = () => {
    gesture.current?.binding?.setPaused('swipe:' + id, false);
    gesture.current = null;
    setMovement({x: 0, y: 0, direction: undefined});
  };
  React.useLayoutEffect(() => {
    setMovement({x: 0, y: 0, direction: undefined});
    return () => {gesture.current?.binding?.setPaused('swipe:' + id, false); gesture.current = null;};
  }, [controller, id, phase]);
  return {movement, handlers: {
    onPointerDown(event: React.PointerEvent) {
      if (event.button !== 0 || !enabled || (event.target as Element).closest('button,a,input,select,textarea,[role="button"],[role="link"],[role="checkbox"],[role="switch"],[role="combobox"],[contenteditable],[data-swipe-ignore],[data-base-ui-swipe-ignore]')) return;
      gesture.current = {id: event.pointerId, x: event.clientX, y: event.clientY, binding: binding.current};
    },
    onPointerMove(event: React.PointerEvent) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const x = event.clientX - start.x, y = event.clientY - start.y, direction = swipeDirectionFor(x, y);
      if (Math.max(Math.abs(x), Math.abs(y)) < 8 || !directions.includes(direction)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      start.binding?.setPaused('swipe:' + id, true);
      setMovement({x, y, direction});
    },
    onPointerUp(event: React.PointerEvent) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      gesture.current = null;
      start.binding?.setPaused('swipe:' + id, false);
      const x = event.clientX - start.x, y = event.clientY - start.y, direction = swipeDirectionFor(x, y), bounds = node.current?.getBoundingClientRect();
      const extent = bounds && (direction === 'left' || direction === 'right' ? bounds.width : bounds.height);
      if (extent && directions.includes(direction) && Math.max(Math.abs(x), Math.abs(y)) >= Math.max(48, extent * .3)) {
        restoreAfterClose(owner, id);
        controller.close(id);
      } else setMovement({x: 0, y: 0, direction: undefined});
    },
    onLostPointerCapture: cancel,
    onPointerCancel: cancel,
  }};
}
function Root({toast: input, swipeDirection = ['right'], ref, ...props}: ToastRootProps) {
  const {controller, state: queue, binding, nodes, returnFocus, focusedId} = useToastContext();
  const toast = queue.toasts.find(item => item.id === input.id && item.revision === input.revision), record = toast ?? input;
  const id = record.id, revision = record.revision, phase = record.transitionStatus, present = Boolean(toast);
  const node = React.useRef<HTMLDivElement | null>(null), rootBinding = React.useRef<ToastViewBinding | null>(null);
  const defaultTitleId = React.useId(), defaultDescriptionId = React.useId();
  const [titleId, setTitleId] = React.useState<string | undefined>(), [descriptionId, setDescriptionId] = React.useState<string | undefined>();
  const directions = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];
  const swipe = useToastSwipe({controller, nodes, returnFocus}, id, present && phase !== 'ending', phase, node, rootBinding, directions);
  React.useLayoutEffect(() => () => {
    const target = returnFocus.current;
    if (focusedId.current !== id) return;
    focusedId.current = null;
    queueMicrotask(() => {if (document.activeElement === document.body && target?.isConnected) target.focus({preventScroll: true});});
  }, [controller, id, returnFocus, focusedId]);
  React.useLayoutEffect(() => {
    const element = node.current;
    if (!element || !present) return;
    nodes.current.set(id, element);
    const lease = controller.bindView();
    rootBinding.current = lease;
    if (element.contains(element.ownerDocument.activeElement)) focusedId.current = id;
    lease.setPaused('hover', element.matches(':hover'));
    lease.setPaused('focus', element.contains(element.ownerDocument.activeElement));
    lease.setExpanded(element.matches(':hover') || element.contains(element.ownerDocument.activeElement));
    return () => {
      lease.release();
      if (rootBinding.current === lease) rootBinding.current = null;
      if (nodes.current.get(id) === element) nodes.current.delete(id);
    };
  }, [controller, present, id, nodes, focusedId]);
  React.useLayoutEffect(() => {
    if (!present) return;
    let active = true;
    if (phase === 'starting') {
      const frame = requestAnimationFrame(() => {if (active) binding.current?.entered(id, revision);});
      return () => {active = false; cancelAnimationFrame(frame);};
    }
    if (phase === 'ending') {
      restoreAfterClose({controller, nodes, returnFocus}, id);
      const frame = requestAnimationFrame(() => {
        const lease = binding.current, animations = node.current?.getAnimations?.() ?? [];
        void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {if (active) lease?.exited(id, revision);});
      });
      return () => {active = false; cancelAnimationFrame(frame);};
    }
  }, [controller, id, revision, phase, present, binding, nodes, returnFocus]);
  const state: ToastRootState = {transitionStatus: phase, expanded: queue.expanded, limited: record.limited, type: record.type, swiping: swipe.movement.direction !== undefined, swipeDirection: swipe.movement.direction};
  const movement = swipe.movement;
  const element = usePart('div', {...props, ref: [ref, node, record.ref] as unknown as React.Ref<HTMLDivElement>}, state, 'xui-toast', {
    hidden: !present, inert: phase === 'ending' || record.limited && !queue.expanded, tabIndex: -1,
    role: record.priority === 'high' ? 'alert' : 'status', 'aria-atomic': true,
    'aria-live': phase === 'ending' || record.limited && !queue.expanded ? 'off' : record.priority === 'high' ? 'assertive' : 'polite',
    'aria-labelledby': titleId, 'aria-describedby': descriptionId,
    'data-swipe-direction': state.swipeDirection, 'data-starting-style': phase === 'starting' ? '' : undefined,
    'data-ending-style': phase === 'ending' ? '' : undefined, 'data-limited': record.limited ? '' : undefined,
    'data-expanded': state.expanded ? '' : undefined, 'data-swiping': state.swiping ? '' : undefined,
    style: {touchAction: directions.some(direction => direction === 'up' || direction === 'down') ? 'none' : 'pan-y', '--toast-swipe-movement-x': `${movement.x}px`, '--toast-swipe-movement-y': `${movement.y}px`} as React.CSSProperties,
    onPointerEnter: () => {rootBinding.current?.setPaused('hover', true); rootBinding.current?.setExpanded(true);},
    onPointerLeave: () => {rootBinding.current?.setPaused('hover', false); if (!node.current?.contains(document.activeElement)) rootBinding.current?.setExpanded(false);},
    onFocusCapture: (event: React.FocusEvent) => {
      rootBinding.current?.setPaused('focus', true); rootBinding.current?.setExpanded(true); focusedId.current = id;
      if (event.relatedTarget instanceof HTMLElement && !event.relatedTarget.closest('.xui-toast,.xui-toast-viewport')) returnFocus.current = event.relatedTarget;
    },
    onBlurCapture: (event: React.FocusEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node)) return;
      rootBinding.current?.setPaused('focus', false);
      if (!event.currentTarget.matches(':hover')) rootBinding.current?.setExpanded(false);
      if (focusedId.current === id) focusedId.current = null;
    },
    onKeyDown: (event: React.KeyboardEvent) => {if (!event.defaultPrevented && event.key === 'Escape') {event.preventDefault(); restoreAfterClose({controller, nodes, returnFocus}, id); controller.close(id);}},
    ...swipe.handlers,
  });
  const item = React.useMemo(() => ({toast: record, titleId, descriptionId, defaultTitleId, defaultDescriptionId, setTitleId, setDescriptionId}), [record, titleId, descriptionId, defaultTitleId, defaultDescriptionId]);
  return <ItemContext.Provider value={item}>{present ? element : null}</ItemContext.Provider>;
}

type TextState = {
    type: string | undefined;
};
export type ToastTitleProps = PartProps<'h2', TextState>;
function useToastLabelElement(element: React.ReactElement, defaultId: string, setId: React.Dispatch<React.SetStateAction<string | undefined>>) {
  const rendered = React.isValidElement<{id?: string; children?: React.ReactNode}>(element) ? element : null;
  const visible = rendered!==null&&hasContent(rendered.props.children), id = rendered?.props.id ?? defaultId;
  React.useLayoutEffect(() => {
    if (!visible) return;
    setId(id);
    return () => {setId(current => current === id ? undefined : current);};
  }, [visible, id, setId]);
  return visible ? element : null;
}
function Title({id, children, ...props}: ToastTitleProps) {
  const item = useToastItemContext(), resolved = id ?? item.defaultTitleId;
  const element = usePart('h2', props, {type: item.toast.type}, 'xui-label', {id: resolved, children: children ?? item.toast.title});
  return useToastLabelElement(element, resolved, item.setTitleId);
}
export type ToastDescriptionProps = PartProps<'p', TextState>;
function Description({id, children, ...props}: ToastDescriptionProps) {
  const item = useToastItemContext(), resolved = id ?? item.defaultDescriptionId;
  const element = usePart('p', props, {type: item.toast.type}, 'xui-help', {id: resolved, children: children ?? item.toast.description});
  return useToastLabelElement(element, resolved, item.setDescriptionId);
}
export type ToastContentProps = PartProps<'div', {
    expanded: boolean;
    behind: boolean;
}>;
function Content(props: ToastContentProps) { const value = useToastContext(), item = useToastItemContext(); return usePart('div', props, { expanded: value.state.expanded, behind: value.state.toasts[0]?.id !== item.toast.id }, 'xui-toast-content'); }
export type ToastActionsProps = PartProps<'div', TextState>;
function Actions(props: ToastActionsProps) { const { toast } = useToastItemContext(); return usePart('div', props, { type: toast.type }, 'xui-toast-actions'); }
function hasTextContent(value: React.ReactNode): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.some(hasTextContent);
  if (React.isValidElement<{children?: React.ReactNode}>(value) && (value.type === React.Fragment || typeof value.type === 'string' && value.type !== 'svg')) return hasTextContent(value.props.children);
  return false;
}
export type ToastCloseProps = Omit<React.ComponentProps<typeof BaseButton>, 'className' | 'style'> & Pick<PartProps<'button', TextState>, 'className' | 'style'>;
function Close({ className, style, ...props }: ToastCloseProps) { const value = useToastContext(), { toast } = useToastItemContext(), state = { type: toast.type }; return <BaseButton {...mergeProps({ type: 'button', 'aria-label': hasTextContent(props.children)||(React.isValidElement<{children?:React.ReactNode}>(props.render)&&hasTextContent(props.render.props.children))||typeof props.render==='function' ? undefined : 'Close notification', 'data-variant': 'ghost', 'data-size': 'sm', onClick: (event: React.MouseEvent) => { if (!event.defaultPrevented) {
        restoreAfterClose(value, toast.id);
        value.controller.close(toast.id);
    } } }, props)} className={branded('xui-button', typeof className === 'function' ? className(state) : className)} style={typeof style === 'function' ? style(state) : style}/>; }
export type ToastActionProps = ToastCloseProps;
function Action({className, style, children, nativeButton, focusableWhenDisabled, ...props}: ToastActionProps) {
  const {toast} = useToastItemContext(), state = {type: toast.type};
  const content = toast.actionProps?.children ?? children;
  const merged = mergeProps({type: 'button' as const, 'data-variant': 'outline', 'data-size': 'sm'}, toast.actionProps, props, {children: content});
  const element = usePart('button', {...merged, className, style}, state, 'xui-button');
  const visible = React.isValidElement<{children?: React.ReactNode}>(element) && hasContent(element.props.children);
  return visible ? <BaseButton nativeButton={nativeButton} focusableWhenDisabled={focusableWhenDisabled} disabled={merged.disabled} render={element}/> : null;
}

export type ToastPortalProps = PartProps<'div', Record<string, never>> & {
    container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null;
};
function Portal({ container, ...props }: ToastPortalProps) { const [mounted, setMounted] = React.useState(false); React.useLayoutEffect(() => setMounted(true), []); const element = usePart('div', props, {}, 'xui-layer'); const target = container && 'current' in container ? container.current : container; return mounted ? createPortal(<PortalTargetContext.Provider value={target ?? document.body}>{element}</PortalTargetContext.Provider>, target ?? document.body) : null; }
export type ToastPositionerProps = React.ComponentProps<typeof BasePopover.Positioner> & {
    toast: ToastObject<any>;
};
function Positioner({ toast, children, ...props }: ToastPositionerProps) { const value = useToastContext(), target = React.useContext(PortalTargetContext), present = value.state.toasts.some(item => item.id === toast.id && item.revision === toast.revision); return <BasePopover.Root open={present} modal={false}><BasePopover.Portal container={target}><BasePopover.Positioner side="top" {...toast.positionerProps} {...props}>{children}</BasePopover.Positioner></BasePopover.Portal></BasePopover.Root>; }
/** Public parts share one queue. Base UI is used only for buttons/rendering/anchor geometry. */
export const Toast = { Provider, Viewport, Root, Content, Title, Description, Close, Action, Actions, Portal, Positioner, Arrow: BasePopover.Arrow, useToastManager, createToastManager };
