import * as React from 'react';
import {Combobox as Base} from '@base-ui/react/combobox';
// The peer owns active-item restoration; this context only projects input modality.
export const KeyboardPhase=React.createContext<{active:boolean;setActive:React.Dispatch<React.SetStateAction<boolean>>}|null>(null);
export function ControlledComboboxRoot<V,M extends boolean|undefined=false>({phase,...props}:React.ComponentProps<typeof Base.Root<V,M>>&{phase:NonNullable<React.ContextType<typeof KeyboardPhase>>}){return <KeyboardPhase.Provider value={phase}><Base.Root<V,M> {...props}/></KeyboardPhase.Provider>;}
