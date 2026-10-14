import { defineConfig } from '@playwright/test';
import {chromiumLaunchOptions} from './tests/browser/chromium-launch-options.mjs';
export default defineConfig({
  testDir:'./tests/browser', workers:2, timeout:30000,
  reporter:[['list'],['json',{outputFile:'test-results/browser.json'}]],
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:800},trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{...chromiumLaunchOptions,chromiumSandbox:true,args:[]}},
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173/react/',reuseExistingServer:!process.env.CI},
});
