/** Official CSS palette families. Brightness remains the independent ThemeMode. */
export type ThemePreset='violet'|'ember'|'forest'|'crimson'|'cobalt'|'precision';
/** Shared validation for configuration, the document owner and the pre-paint script. */
export function isThemePreset(value:unknown):value is ThemePreset{return value==='violet'||value==='ember'||value==='forest'||value==='crimson'||value==='cobalt'||value==='precision';}
