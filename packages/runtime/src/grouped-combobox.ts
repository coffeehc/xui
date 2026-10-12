/** Already-filtered options. IDs are opaque strings, unique across every group. */
export interface GroupedComboboxItem {id:string;label:string;disabled?:boolean}
export interface GroupedComboboxPagination {page:number;pageCount:number;disabled?:boolean;previousLabel?:string;nextLabel?:string}
export interface GroupedComboboxGroup {
  id:string;label:string;items:readonly GroupedComboboxItem[];
  /** Omit for a permanently visible group. A boolean opts into controlled disclosure. */
  open?:boolean;
  disabled?:boolean;busy?:boolean;emptyLabel?:string;pagination?:GroupedComboboxPagination;
}
export interface GroupedComboboxOptions {
  label:string;groups:readonly GroupedComboboxGroup[];
  /** Query and filtering are owned by the host, including debounce and cancellation. */
  inputValue:string;onInputValueChange?:(value:string)=>void;
  value?:string|null;defaultValue?:string|null;onValueChange?:(value:string|null)=>void;
  onGroupOpenChange?:(id:string,open:boolean)=>void;
  onPageChange?:(id:string,page:number)=>void;
  disabled?:boolean;emptyLabel?:string;controlsLabel?:string;
}
/** Shared validation/flattening, not a query or selection owner. */
export function getGroupedComboboxItems(groups:readonly GroupedComboboxGroup[]) {
  const groupIds=new Set<string>(),itemIds=new Set<string>();
  const items:GroupedComboboxItem[]=[],visible:GroupedComboboxItem[]=[];
  for(const group of groups){
    if(typeof group.id!=='string'||!group.id||groupIds.has(group.id)||typeof group.label!=='string')throw new TypeError('GroupedCombobox groups need unique nonempty string ids and labels');
    groupIds.add(group.id);
    if(group.open!==undefined&&typeof group.open!=='boolean')throw new TypeError('GroupedCombobox open must be boolean');
    const page=group.pagination;
    if(page&&(!Number.isSafeInteger(page.page)||!Number.isSafeInteger(page.pageCount)||page.page<1||page.pageCount<1||page.page>page.pageCount))throw new TypeError('GroupedCombobox pagination needs 1 <= page <= pageCount');
    for(const item of group.items){
      if(typeof item.id!=='string'||!item.id||itemIds.has(item.id)||typeof item.label!=='string')throw new TypeError('GroupedCombobox items need globally unique nonempty string ids and labels');
      itemIds.add(item.id);const entry={...item,disabled:!!group.disabled||!!item.disabled};items.push(entry);
      if(group.open!==false)visible.push(entry);
    }
  }
  return {items,visible};
}
