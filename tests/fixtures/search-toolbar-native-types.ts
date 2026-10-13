import {createSearchToolbar,type SearchToolbarOptions,type SearchToolbarController} from '@coffeehc/xui-runtime/search-toolbar-dom';
import {createSearchToolbar as rootExport} from '@coffeehc/xui-runtime';
const options:SearchToolbarOptions={search:document.createElement('input'),actions:document.createDocumentFragment(),advanced:null,defaultExpanded:true,onExpandedChange(value:boolean){view.update({expanded:value});}};
const view:SearchToolbarController=createSearchToolbar(document.createElement('div'),options);
view.update({expanded:false,actions:null});view.getExpanded();view.getElement();view.destroy();void rootExport;
// @ts-expect-error Search content is a Node, not markup text.
createSearchToolbar(document.createElement('div'),{search:'<input>'});
