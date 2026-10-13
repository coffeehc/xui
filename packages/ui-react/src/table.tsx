import * as React from 'react';
import {cx} from './shared.js';
export function Table({className,striped,stickyHeader,...props}:React.ComponentProps<'table'>&{striped?:boolean;stickyHeader?:boolean}){return <table {...props} className={cx('xui-table',className)} data-striped={striped} data-sticky-header={stickyHeader}/>;}
export function TableContainer({className,...props}:React.ComponentProps<'div'>){return <div tabIndex={0} role="region" {...props} className={cx('xui-table-container',className)}/>;}
export function TableCaption({className,...props}:React.ComponentProps<'caption'>){return <caption {...props} className={cx('xui-table-caption',className)}/>;}
export function TableHead(props:React.ComponentProps<'thead'>){return <thead {...props}/>;}
export function TableBody(props:React.ComponentProps<'tbody'>){return <tbody {...props}/>;}
export function TableRow({className,selected,expanded,...props}:React.ComponentProps<'tr'> & {selected?:boolean;expanded?:boolean}){return <tr {...props} className={cx('xui-table-row',className)} data-selected={selected} data-expanded={expanded}/>;}
export interface StickyCellProps {sticky?:'start'|'end';stickyOffset?:React.CSSProperties['insetInlineStart']}
function stickyStyle(sticky:StickyCellProps['sticky'],offset:StickyCellProps['stickyOffset'],style:React.CSSProperties|undefined){return sticky&&offset!==undefined?{...style,[sticky==='start'?'insetInlineStart':'insetInlineEnd']:offset}:style;}
export function TableHeaderCell({sticky,stickyOffset,style,...props}:React.ComponentProps<'th'>&StickyCellProps){return <th scope="col" {...props} data-sticky={sticky} style={stickyStyle(sticky,stickyOffset,style)}/>;}
export function TableCell({sticky,stickyOffset,style,...props}:React.ComponentProps<'td'>&StickyCellProps){return <td {...props} data-sticky={sticky} style={stickyStyle(sticky,stickyOffset,style)}/>;}
export function TableExpandedRow({colSpan,children,className,...props}:React.ComponentProps<'tr'>&{colSpan:number}){return <tr {...props} className={cx('xui-table-row xui-table-expanded-row',className)}><td colSpan={colSpan}>{children}</td></tr>;}
export function TableExpandButton({expanded,controls,className,...props}:React.ComponentProps<'button'>&{expanded:boolean;controls:string}){return <button type="button" {...props} aria-expanded={expanded} aria-controls={controls} className={cx('xui-sort-button',className)}/>;}
/** Host owns aria-sort on the th and the actual ordering; one click, one callback. */
export function SortButton({className,...props}:React.ComponentProps<'button'>){return <button type="button" {...props} className={cx('xui-sort-button',className)}/>;}

/** Visual row-action layout only; the host retains labels, permissions and callbacks. */
export function TableActions({className,...props}:React.ComponentProps<'div'>){return <div {...props} className={cx('xui-table-actions',className)}/>;}
