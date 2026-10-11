import * as React from 'react';
import {cx} from './shared.js';
export function Table({className,...props}:React.ComponentProps<'table'>){return <table {...props} className={cx('xui-table',className)}/>;}
export function TableContainer({className,...props}:React.ComponentProps<'div'>){return <div tabIndex={0} role="region" {...props} className={cx('xui-table-container',className)}/>;}
export function TableCaption({className,...props}:React.ComponentProps<'caption'>){return <caption {...props} className={cx('xui-table-caption',className)}/>;}
export function TableHead(props:React.ComponentProps<'thead'>){return <thead {...props}/>;}
export function TableBody(props:React.ComponentProps<'tbody'>){return <tbody {...props}/>;}
export function TableRow({className,selected,...props}:React.ComponentProps<'tr'> & {selected?:boolean}){return <tr {...props} className={cx('xui-table-row',className)} data-selected={selected}/>;}
export function TableHeaderCell(props:React.ComponentProps<'th'>){return <th scope="col" {...props}/>;}
export function TableCell(props:React.ComponentProps<'td'>){return <td {...props}/>;}
/** Host owns aria-sort on the th and the actual ordering; one click, one callback. */
export function SortButton({className,...props}:React.ComponentProps<'button'>){return <button type="button" {...props} className={cx('xui-sort-button',className)}/>;}
