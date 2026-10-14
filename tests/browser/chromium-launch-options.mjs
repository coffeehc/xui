import {existsSync} from 'node:fs';
import {chromium} from '@playwright/test';

// Keep local runs on the same full Chromium used by real browser UI tests.
// headless_shell cannot operate Chrome settings pages used by genuine zoom cases.
export const chromiumLaunchOptions=process.env.CI
  ? {channel:'chrome'}
  : existsSync('/usr/bin/chromium')
    ? {executablePath:'/usr/bin/chromium'}
    : {executablePath:chromium.executablePath()};
