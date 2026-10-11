export const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(' ');
export function branded<State>(base: string, value: string | ((state: State) => string | undefined) | undefined) {
  return typeof value === 'function' ? (state: State) => cx(base,value(state)) : cx(base,value);
}
