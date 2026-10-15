/** Locale facts stay with the host's existing i18n owner. Omission is disabled. */
export interface HeaderLocaleOption {value:string;label:string;disabled?:boolean}
export interface HeaderLocaleOptions {
  enabled:boolean;value:string;options:readonly HeaderLocaleOption[];
  onValueChange:(value:string)=>void;label?:string;disabled?:boolean;
}
export function isHeaderLocaleEnabled(locale?:HeaderLocaleOptions):locale is HeaderLocaleOptions{return locale?.enabled===true;}
