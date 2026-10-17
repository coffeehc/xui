import {projectConfig} from './project-config';
// Same project JSON/overrides as bootstrap; this tiny script creates no owner.
window.xuiThemeOptions={preset:projectConfig.theme?.preset,defaultMode:projectConfig.theme?.mode};
