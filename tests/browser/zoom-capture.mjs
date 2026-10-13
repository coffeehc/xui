import {expect,test} from '@playwright/test';
/** Capture the actual Chrome view without Playwright's CSS viewport clip at page zoom. */
export async function captureZoomViewport(page){
 const session=await page.context().newCDPSession(page);
 try{const {data}=await session.send('Page.captureScreenshot',{format:'png',fromSurface:false,captureBeyondViewport:false});const png=Buffer.from(data,'base64');const width=png.readUInt32BE(16),height=png.readUInt32BE(20),viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));await test.info().attach('zoom-native-viewport-metrics.json',{body:JSON.stringify({width,height,viewport}),contentType:'application/json'});if(width<Math.floor(viewport.width*viewport.dpr)-1||height<Math.floor(viewport.height*viewport.dpr)-1)await test.info().attach('zoom-native-viewport-rejected.png',{body:png,contentType:'image/png'});expect(width).toBeGreaterThanOrEqual(Math.floor(viewport.width*viewport.dpr)-1);expect(height).toBeGreaterThanOrEqual(Math.floor(viewport.height*viewport.dpr)-1);return png;}finally{await session.detach();}
}
