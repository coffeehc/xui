import * as React from 'react';
export const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(' ');
export function branded<State>(base: string, value: string | ((state: State) => string | undefined) | undefined) {
  return typeof value === 'function' ? (state: State) => cx(base,value(state)) : cx(base,value);
}

/** Empty public slots do not reserve geometry; fragments/arrays follow their rendered content. */
export const hasContent=(value:React.ReactNode):boolean=>{
 if(value===undefined||value===null||typeof value==='boolean')return false;
 if(typeof value==='string')return value.length>0;
 if(Array.isArray(value))return value.some(hasContent);
 if(React.isValidElement<{children?:React.ReactNode}>(value)&&value.type===React.Fragment)return hasContent(value.props.children);
 return true;
};
