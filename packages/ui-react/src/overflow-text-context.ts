import * as React from 'react';

/** Existing cards and data rows lend their interaction surface to passive text. */
export const OverflowTextInteraction=React.createContext<React.RefObject<HTMLElement|null>|undefined>(undefined);
