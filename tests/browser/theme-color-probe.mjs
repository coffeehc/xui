export async function colors(page){return page.evaluate(()=>{
 const probe=document.createElement('span');document.body.append(probe);
 const context=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
 const rgb=value=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].slice(0,3);};
 const token=name=>{probe.style.color=`var(--${name})`;return rgb(getComputedStyle(probe).color);};
 const luminance=color=>color.map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const names=['layer-canvas','layer-shell','layer-surface','layer-raised','layer-overlay','table-header-background','table-row-background','table-row-stripe-background','separator-line','surface-line','input-border-color','input-background','interaction-focus','foreground','muted-foreground','action-primary','action-primary-foreground','button-hover-background','button-pressed-background','interaction-selected','interaction-selected-foreground'];
 const values=Object.fromEntries(names.map(name=>[name,token(name)])),ratios={};
 for(const surface of ['layer-canvas','layer-shell','layer-surface','layer-raised','layer-overlay']){
  ratios[`body/${surface}`]=contrast(values.foreground,values[surface]);
  ratios[`muted/${surface}`]=contrast(values['muted-foreground'],values[surface]);
  ratios[`link/${surface}`]=contrast(values['action-primary'],values[surface]);
  ratios[`focus/${surface}`]=contrast(values['interaction-focus'],values[surface]);
  ratios[`input/${surface}`]=contrast(values['input-border-color'],values[surface]);
 }
 ratios.secondary=contrast(token('action-secondary-foreground'),token('action-secondary'));
 document.querySelectorAll('.xui-card .xui-badge').forEach((node,index)=>{const style=getComputedStyle(node);ratios[`badge/${index}`]=contrast(rgb(style.color),rgb(style.backgroundColor));});
 ratios['input/inside']=contrast(values['input-border-color'],values['input-background']);
 ratios.selected=contrast(values['interaction-selected-foreground'],values['interaction-selected']);
 for(const state of ['action-primary','button-hover-background','button-pressed-background'])ratios[`primary/${state}`]=contrast(values['action-primary-foreground'],values[state]);
 for(const tone of ['info','success','warning','error'])ratios[`status/${tone}`]=contrast(token(`status-${tone}-foreground`),token(`status-${tone}-soft`));
 const header=document.querySelector('th'),cell=document.querySelector('tbody td');
 const actual={header:header?getComputedStyle(header).backgroundColor:null,row:cell?getComputedStyle(cell.parentElement).backgroundColor:null};
 probe.remove();return {values,ratios,actual};
});}
