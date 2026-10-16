import { mkdir, mkdtemp, readFile, writeFile, cp, copyFile, realpath, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { extract } from './tokens.mjs';
import { gzipSync } from 'node:zlib';
import { collectPublicAPI } from './public-api.mjs';
const root = process.cwd(), archives = resolve('.artifacts');
await mkdir(archives, { recursive: true });
const tarballs = [];
for (const pkg of ['theme', 'runtime', 'ui-react']) {
    const output = execFileSync('npm', ['pack', '--json', '--pack-destination', archives], { cwd: `packages/${pkg}`, encoding: 'utf8', env: { ...process.env, npm_config_cache: '/tmp/xui-npm-cache' } });
    const info = JSON.parse(output)[0];
    assert(info.files.every(file => !file.path.startsWith('src/')), 'Packed source unexpectedly');
    tarballs.push(resolve(archives, info.filename));
}
const config = JSON.parse(await readFile('package.json', 'utf8'));
const publicAPI = await collectPublicAPI();
const runtimeManifest = JSON.parse(await readFile('packages/runtime/package.json', 'utf8'));
const runtimeEntryPattern = /(?:^|\/)(?:dom|[^/]*-dom|menu-layout|navigation-presentation|overflow-text|select-control|textarea|widgets-dom|internal)(?:\.js)?$/;
assert(!Object.keys(runtimeManifest.exports).some(entry => runtimeEntryPattern.test(entry)), 'Runtime manifest still exposes a removed UI entry');
assert(!Object.keys(runtimeManifest.peerDependencies ?? {}).some(name => /^(?:react|react-dom)(?:$|\/)/.test(name)), 'React must remain a ui-react-only peer');
assert(!Object.keys(runtimeManifest.dependencies ?? {}).some(name => /^(?:react|react-dom)(?:$|\/)/.test(name)), 'Runtime must not depend on React');
const runtimeRoot = publicAPI.find(entry => entry.package === '@coffeehc/xui-runtime' && entry.entry === '.');
assert(runtimeRoot, 'Runtime root public entry is missing');
assert(!runtimeRoot.symbols.some(name => ['Button','Card','Dialog','Field','Input','Textarea','SimpleSelect','Calendar','DateTimePicker','NavigationMenu','MenuLayout','OverflowText'].includes(name)), 'Runtime root still exports React UI components');
const runtimeDistFiles = await readdir('packages/runtime/dist');
const removedUiFiles = runtimeDistFiles.filter(file => /^(?:dom|[^/]*-dom|dialog-layout|menu-layout|navigation-presentation|overflow-text|select-control|textarea|widgets|dom-id)\.(?:js|d\.ts)$/.test(file));
assert.deepEqual(removedUiFiles, [], 'Runtime dist still contains deleted native UI bundles');
assert(runtimeRoot.symbols.includes('createCalendarModel') && runtimeRoot.symbols.includes('createDateTimeModel'), 'Pure TypeScript runtime models were removed with the UI');
assert(!runtimeRoot.symbols.includes('isDataTableRowEvent'), 'The DOM-backed row event filter belongs to the React package, not the pure runtime');
await writeFile(`${archives}/public-api.json`, JSON.stringify({ entries: publicAPI }, null, 2) + '\n');
// Critical + floating CSS: danger added 56 gzip bytes above the 16 KiB baseline.
// Public form/feedback composition adds 240 more; keep the bounded allowances
// of 128 bytes for danger and 256 bytes for the new layout (16,768 total).
// DESIGN 0.18 adds the shared Card frame and PageHeader metadata slots.
// Allow 256 additional gzip bytes for this feature; keep JS/button budgets unchanged.
// React 1.0 replaces the native Select controller with the public Base UI Select.
// Raise the previous 128 KiB cap by 4 KiB to 132 KiB; the measured total remains gated.
// 1.2 adds public Card regions/equal tracks, content-width Tabs and Icon states.
// The formal consumer measured 18,276 gzip bytes (+488 from 1.1.3); bound this
// compatible presentation release to 18 KiB, without changing JS/Button limits.
const performance = { budgets: { buttonMinified: 65536, buttonGzip: 16384, criticalCssGzip: 18432, reactInitialJsGzip: 135168 }, button: [], consumers: [] };
await mkdir('.consumers', { recursive: true });
// A fresh directory prevents npm reusing an earlier tarball with the same version.
const runDirectory = await mkdtemp(resolve('.consumers/run-'));
await writeFile('.consumers/latest.json', JSON.stringify({ runDirectory }, null, 2));
{
    const kind = "react";
    const cwd = resolve(runDirectory, kind);
    await mkdir(cwd, { recursive: true });
    const dependencies = Object.fromEntries(tarballs.slice(0, 3).map((file, index) => [['@coffeehc/xui-theme', '@coffeehc/xui-runtime', '@coffeehc/xui-react'][index], `file:${file}`]));
    for (const name of ['react', 'react-dom', '@base-ui/react', '@types/react', '@types/react-dom'])
        dependencies[name] = config.devDependencies[name];
    await writeFile(`${cwd}/package.json`, JSON.stringify({ name: `xui-${kind}-consumer`, private: true, type: 'module', dependencies }, null, 2));
    // npm installs real packed files in a standalone directory, never workspace aliases.
    execFileSync('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--cache', '/tmp/xui-npm-cache'], { cwd, stdio: 'inherit' });
    await cp(`examples/${kind}`, cwd, { recursive: true });
    await copyFile('examples/shared/layout.css', `${cwd}/layout.css`);
    await writeFile(`${cwd}/product.css`, extract(await readFile('docs/DESIGN.md', 'utf8'), 'design-product-css'));
    const require = createRequire(`${cwd}/package.json`);
    assert(!String(await realpath(`${cwd}/node_modules/@coffeehc/xui-runtime`)).includes('/packages/'));
    for (const [name, entry] of [['runtime', 'index.js'], ['theme', 'style.css'], ...([['react', 'index.js']])]) {
        const localName = name === 'react' ? 'ui-react' : name;
        assert.equal(await readFile(`${cwd}/node_modules/@coffeehc/xui-${name}/dist/${entry}`, 'utf8'), await readFile(`packages/${localName}/dist/${entry}`, 'utf8'), 'Installed tarball is stale');
    }
    const available = publicAPI, esm = available.filter(entry => entry.kind === 'esm');
    await writeFile(`${cwd}/public-exports.mjs`, esm.map((entry, index) => `import * as Entry${index} from '${entry.specifier}';`).join('\n') + `\nconsole.log(JSON.stringify([${esm.map((entry, index) => `Object.keys(Entry${index}).sort()`).join(',')}]));\n`);
    const runtimeNames = JSON.parse(execFileSync('node', ['public-exports.mjs'], { cwd, encoding: 'utf8' }));
    for (const entry of available) {
        const installed = resolve(cwd, 'node_modules', entry.package, entry.target);
        assert.equal(await readFile(installed, 'utf8'), await readFile(resolve('packages', entry.directory, entry.target), 'utf8'), `Stale public entry ${entry.specifier}`);
        if (entry.types) {
            assert.equal(await readFile(resolve(cwd, 'node_modules', entry.package, entry.types), 'utf8'), await readFile(resolve('packages', entry.directory, entry.types), 'utf8'), `Stale declaration ${entry.specifier}`);
            assert.deepEqual(runtimeNames[esm.indexOf(entry)], entry.values, `Runtime/declaration export drift ${entry.specifier}`);
        }
    }
    const allTypes = esm.map((entry, index) => `import type {${entry.symbols.map((name, n) => `${name} as Entry${index}Symbol${n}`).join(',')}} from '${entry.specifier}';`).join('\n');
    await writeFile(`${cwd}/public-types.ts`, allTypes + '\n');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', 'public-types.ts'], { cwd, stdio: 'inherit' });
    await writeFile(`${cwd}/public-feedback-types.ts`, [
        "import {type AdminSetupLabels,type AdminSetupCheck,createAdminSetupController} from '@coffeehc/xui-runtime/admin-setup';",
        "import {type TextareaProps} from '@coffeehc/xui-react/forms';",
        "import {type LoginPageConfig,type LoginPageLabels} from '@coffeehc/xui-runtime/auth';",
        "import {type NewPasswordLabels} from '@coffeehc/xui-runtime/password';",
        "const config:LoginPageConfig={productName:'Example',labels:{showPassword:'显示密码',hidePassword:'隐藏密码'}};",
        "const legacyPassword:NewPasswordLabels={} as Omit<NewPasswordLabels,'showPassword'|'hidePassword'>;",
        "const legacyLogin:LoginPageLabels={} as Omit<LoginPageLabels,'showPassword'|'hidePassword'>;const legacySetup:AdminSetupLabels={} as Omit<AdminSetupLabels,'check'|'checking'|'checkError'>;",
        "const onCheck:AdminSetupCheck=({signal})=>signal.aborted?'unconfirmed':'complete';",
        "createAdminSetupController({state:{status:'unconfirmed'},onSubmit:()=> 'unconfirmed',onCheck}).check();",
        "const props:TextareaProps={autoResize:{maxRows:6},rows:2,readOnly:true};",
        "// @ts-expect-error a read cannot authorize another initialization write",
        "const invalidRead:AdminSetupCheck=()=> 'idle';",
        "// @ts-expect-error row caps are numeric",
        "const invalidSize:TextareaProps={autoResize:{maxRows:'six'}};",
        "void [config,legacyPassword,legacyLogin,legacySetup,props,invalidRead,invalidSize];",
    ].join('\n'));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', 'public-feedback-types.ts'], { cwd, stdio: 'inherit' });
    await copyFile('tests/fixtures/interface-scale-types.ts', `${cwd}/interface-scale-types.ts`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', 'interface-scale-types.ts'], { cwd, stdio: 'inherit' });
    await copyFile('tests/fixtures/identity-contract.ts', `${cwd}/identity-contract.ts`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', 'identity-contract.ts'], { cwd, stdio: 'inherit' });
    const allValues = esm.map((entry, index) => `import * as Entry${index} from '${entry.specifier}';`).concat(available.filter(entry => entry.kind === 'css').map(entry => `import '${entry.specifier}';`)).join('\n') + `\nglobalThis.xuiPublicEntries={${esm.map((entry, index) => `${JSON.stringify(entry.specifier)}:Entry${index}`).join(',')}};`;
    const allEntriesBuild = await build({ stdin: { contents: allValues, resolveDir: cwd, sourcefile: 'public-entries.js' }, outdir: resolve(cwd, 'public-entries'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', write: false, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(allEntriesBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'All-entry consumer escaped its standalone install');
    console.log(`${kind}: every installed public ESM/CSS entry, named type and runtime export checked.`);
    await mkdir(`dist/${kind}`, { recursive: true });
    const result = await build({ entryPoints: [`${cwd}/app.${'tsx'}`], outfile: `dist/${kind}/app.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(result.metafile.inputs).every(file => !file.startsWith('packages/')), 'Build read monorepo package source');
    await copyFile(`${cwd}/index.html`, `dist/${kind}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `dist/${kind}/theme-init.js`);
    const initializer = await build({ stdin: { contents: "import '@coffeehc/xui-runtime/init.js';", resolveDir: cwd, sourcefile: 'theme-init-consumer.js' }, bundle: true, format: 'iife', platform: 'browser', target: 'es2022', write: false, metafile: true });
    assert(Object.values(initializer.metafile.outputs).some(output => Object.entries(output.inputs).some(([path, data]) => path.endsWith('/@coffeehc/xui-runtime/dist/init.js') && data.bytesInOutput > 0)), 'Theme initializer was tree-shaken from the packed consumer');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'app.tsx'], { cwd, stdio: 'inherit' });
    const popoverFixture = `popover-boundary.${'tsx'}`;
    await copyFile(`tests/fixtures/${popoverFixture}`, `${cwd}/${popoverFixture}`);
    await copyFile('tests/fixtures/popover-boundary.css', `${cwd}/popover-boundary.css`);
    const popoverOutput = `dist/${kind}/popover-boundary`;
    await mkdir(popoverOutput, { recursive: true });
    const popoverBuild = await build({ entryPoints: [`${cwd}/${popoverFixture}`], outfile: `${popoverOutput}/app.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(popoverBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Popover bounds escaped the standalone tarball install');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', popoverFixture], { cwd, stdio: 'inherit' });
    await writeFile(`${popoverOutput}/index.html`, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="../theme-init.js"></script><link rel="stylesheet" href="./app.css"></head><body class="xui"><div id="root"></div><script type="module" src="./app.js"></script></body></html>');
    await writeFile(`${popoverOutput}/metafile.json`, JSON.stringify(popoverBuild.metafile, null, 2));
    const buttonStateFixture = `button-state-contract.${'tsx'}`;
    await copyFile(`tests/fixtures/${buttonStateFixture}`, `${cwd}/${buttonStateFixture}`);
    const buttonStateBuild = await build({ entryPoints: [`${cwd}/${buttonStateFixture}`], outfile: `dist/${kind}/button-state-contract.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(buttonStateBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Button states escaped the standalone tarball install');
    assert(!Object.keys(buttonStateBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Button states require private CSS');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', buttonStateFixture], { cwd, stdio: 'inherit' });
    await writeFile(`dist/${kind}/button-state-contract.html`, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="./theme-init.js"></script><link rel="stylesheet" href="./button-state-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./button-state-contract.js"></script></body></html>');
    await writeFile(`dist/${kind}/button-state-contract-metafile.json`, JSON.stringify(buttonStateBuild.metafile, null, 2));
    const feedbackFixture = `feedback-foundation-contract.${'tsx'}`;
    await copyFile(`tests/fixtures/${feedbackFixture}`, `${cwd}/${feedbackFixture}`);
    const feedbackBuild = await build({ entryPoints: [`${cwd}/${feedbackFixture}`], outfile: `dist/${kind}/feedback-foundation-contract.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(feedbackBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Feedback foundations escaped the standalone tarball install');
    assert(!Object.keys(feedbackBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Feedback foundations require private CSS');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', feedbackFixture], { cwd, stdio: 'inherit' });
    await writeFile(`dist/${kind}/feedback-foundation-contract.html`, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="./theme-init.js"></script><link rel="stylesheet" href="./feedback-foundation-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./feedback-foundation-contract.js"></script></body></html>');
    await writeFile(`dist/${kind}/feedback-foundation-contract-metafile.json`, JSON.stringify(feedbackBuild.metafile, null, 2));
    const mediaFixture = `media-foundation-contract.${'tsx'}`;
    await copyFile(`tests/fixtures/${mediaFixture}`, `${cwd}/${mediaFixture}`);
    const mediaBuild = await build({ entryPoints: [`${cwd}/${mediaFixture}`], outfile: `dist/${kind}/media-foundation-contract.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(mediaBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Media foundations escaped the standalone tarball install');
    assert(!Object.keys(mediaBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Media foundations require private CSS');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', mediaFixture], { cwd, stdio: 'inherit' });
    await writeFile(`dist/${kind}/media-foundation-contract.html`, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="./theme-init.js"></script><link rel="stylesheet" href="./media-foundation-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./media-foundation-contract.js"></script></body></html>');
    await writeFile(`dist/${kind}/media-foundation-contract-metafile.json`, JSON.stringify(mediaBuild.metafile, null, 2));
    const inputFoundationFixture = `input-foundation-contract.${'tsx'}`;
    await copyFile(`tests/fixtures/${inputFoundationFixture}`, `${cwd}/${inputFoundationFixture}`);
    const inputFoundationBuild = await build({ entryPoints: [`${cwd}/${inputFoundationFixture}`], outfile: `dist/${kind}/input-foundation-contract.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(inputFoundationBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Input foundations escaped the standalone tarball install');
    assert(!Object.keys(inputFoundationBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Input foundations require private CSS');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', inputFoundationFixture], { cwd, stdio: 'inherit' });
    await writeFile(`dist/${kind}/input-foundation-contract.html`, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="./theme-init.js"></script><link rel="stylesheet" href="./input-foundation-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./input-foundation-contract.js"></script></body></html>');
    await writeFile(`dist/${kind}/input-foundation-contract-metafile.json`, JSON.stringify(inputFoundationBuild.metafile, null, 2));
    const choiceStateFixture = `choice-state-contract.${'tsx'}`;
    await copyFile(`tests/fixtures/${choiceStateFixture}`, `${cwd}/${choiceStateFixture}`);
    const choiceStateBuild = await build({ entryPoints: [`${cwd}/${choiceStateFixture}`], outfile: `dist/${kind}/choice-state-contract.js`, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(choiceStateBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Choice states escaped the standalone tarball install');
    assert(!Object.keys(choiceStateBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Choice states require private CSS');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', choiceStateFixture], { cwd, stdio: 'inherit' });
    await writeFile(`dist/${kind}/choice-state-contract.html`, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="./theme-init.js"></script><link rel="stylesheet" href="./choice-state-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./choice-state-contract.js"></script></body></html>');
    await writeFile(`dist/${kind}/choice-state-contract-metafile.json`, JSON.stringify(choiceStateBuild.metafile, null, 2));
    {
        const portal = resolve(cwd, 'popover-portal'), portalOutput = resolve('dist/popover-portal-react');
        await cp('examples/popover-portal-react', portal, { recursive: true });
        await copyFile('tests/fixtures/popover-portal-types.tsx', `${cwd}/popover-portal-types.tsx`);
        const portalBuild = await build({ entryPoints: [`${portal}/app.tsx`], outdir: portalOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(portalBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Popover portal escaped its standalone tarball install');
        assert(!Object.keys(portalBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Popover portal requires private CSS');
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'popover-portal-types.tsx', 'popover-portal/app.tsx'], { cwd, stdio: 'inherit' });
        await copyFile(`${portal}/index.html`, `${portalOutput}/index.html`);
        await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${portalOutput}/theme-init.js`);
        await writeFile(`${portalOutput}/metafile.json`, JSON.stringify(portalBuild.metafile, null, 2));
        await copyFile('tests/fixtures/peer-contract.tsx', `${cwd}/peer-contract.tsx`);
        const fixture = await build({ entryPoints: [`${cwd}/peer-contract.tsx`], outfile: 'dist/react/peer-contract.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(fixture.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Peer fixture read outside the packed consumer');
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'peer-contract.tsx'], { cwd, stdio: 'inherit' });
        await writeFile('dist/react/peer-contract.html', '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./peer-contract.css"></head><body><div id="root"></div><script type="module" src="./peer-contract.js"></script></body></html>');
        await copyFile('tests/fixtures/native-controls-audit.tsx', `${cwd}/native-controls-audit.tsx`);
        const nativeAudit = await build({ entryPoints: [`${cwd}/native-controls-audit.tsx`], outfile: 'dist/react/native-controls-audit.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(nativeAudit.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Native controls audit escaped its packed consumer');
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'native-controls-audit.tsx'], { cwd, stdio: 'inherit' });
        await writeFile('dist/react/native-controls-audit.html', '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><script src="./theme-init.js"></script><link rel="stylesheet" href="./native-controls-audit.css"></head><body class="xui"><div id="root"></div><script type="module" src="./native-controls-audit.js"></script></body></html>');
        await copyFile('tests/fixtures/foundation-contract.tsx', `${cwd}/foundation-contract.tsx`);
        const foundationFixture = await build({ entryPoints: [`${cwd}/foundation-contract.tsx`], outfile: 'dist/react/foundation-contract.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(foundationFixture.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Foundation fixture read outside packed consumer');
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'foundation-contract.tsx'], { cwd, stdio: 'inherit' });
        await writeFile('dist/react/foundation-contract.html', '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./foundation-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./foundation-contract.js"></script></body></html>');
        await copyFile('tests/fixtures/nav-contract.tsx', `${cwd}/nav-contract.tsx`);
        const navFixture = await build({ entryPoints: [`${cwd}/nav-contract.tsx`], outfile: 'dist/react/nav-contract.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(navFixture.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Nav fixture read outside packed consumer');
        for (const [name, entry] of [['react', 'navigation.js'], ['theme', 'navigation.css']])
            assert.equal(await readFile(`${cwd}/node_modules/@coffeehc/xui-${name}/dist/${entry}`, 'utf8'), await readFile(`packages/${name === 'react' ? 'ui-react' : name}/dist/${entry}`, 'utf8'), 'Nav fixture installed stale output');
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'nav-contract.tsx'], { cwd, stdio: 'inherit' });
        await writeFile('dist/react/nav-contract.html', '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./nav-contract.css"></head><body class="xui"><div id="root"></div><script type="module" src="./nav-contract.js"></script></body></html>');
        await writeFile('dist/react/nav-destination.html', '<!doctype html><html><head><meta charset="utf-8"><title>Native link destination</title></head><body>Native link destination</body></html>');
    }
    await writeFile(`dist/${kind}/metafile.json`, JSON.stringify(result.metafile, null, 2));
    const menu = resolve(cwd, 'menu'), menuOutput = resolve(`dist/menu-${kind}`);
    await cp(`examples/menu-${kind}`, menu, { recursive: true });
    await mkdir(`${cwd}/shared`, { recursive: true });
    await copyFile('examples/shared/menu-data.json', `${cwd}/shared/menu-data.json`);
    const menuBuild = await build({ entryPoints: [`${menu}/app.${'tsx'}`], outdir: menuOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(menuBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Menu consumer escaped its standalone install');
    assert(!Object.keys(menuBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Menu consumer depends on private CSS');
    await copyFile(`${menu}/index.html`, `${menuOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${menuOutput}/theme-init.js`);
    await copyFile('examples/shared/menu-destination.html', `${menuOutput}/destination.html`);
    await writeFile(`${menuOutput}/metafile.json`, JSON.stringify(menuBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', '--resolveJsonModule', 'menu/app.tsx'], { cwd, stdio: 'inherit' });
    const layoutTypography = resolve(cwd, 'layout-typography'), layoutTypographyOutput = resolve(`dist/layout-typography-${kind}`);
    await cp(`examples/layout-typography-${kind}`, layoutTypography, { recursive: true });
    await copyFile('examples/shared/layout-typography-model.ts', `${cwd}/shared/layout-typography-model.ts`);
    const layoutTypographyBuild = await build({ entryPoints: [`${layoutTypography}/app.${'tsx'}`], outdir: layoutTypographyOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(layoutTypographyBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Layout/typography consumer escaped its standalone install');
    assert(!Object.keys(layoutTypographyBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Layout/typography consumer depends on private CSS');
    await copyFile(`${layoutTypography}/index.html`, `${layoutTypographyOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${layoutTypographyOutput}/theme-init.js`);
    await writeFile(`${layoutTypographyOutput}/metafile.json`, JSON.stringify(layoutTypographyBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'layout-typography/app.tsx'], { cwd, stdio: 'inherit' });
    // Typography acceptance is built only from the independently installed packages.
    {
      const fixture=resolve(cwd,'typography-slots'),output=resolve('dist/typography-slots-react');
      await cp('examples/typography-slots-react',fixture,{recursive:true});
      const result=await build({entryPoints:[`${fixture}/app.tsx`],outdir:output,bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"'}});
      assert(Object.keys(result.metafile.inputs).every(file=>resolve(file).startsWith(`${cwd}/`)),'Typography slots escaped standalone install');
      assert(!Object.keys(result.metafile.inputs).some(file=>file.endsWith('.css')&&!file.includes('/@coffeehc/xui-theme/')),'Typography slots require private CSS');
      await copyFile(`${fixture}/index.html`,`${output}/index.html`);
      await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'),`${output}/theme-init.js`);
      await writeFile(`${output}/metafile.json`,JSON.stringify(result.metafile,null,2));
      execFileSync('node',[`${root}/node_modules/typescript/bin/tsc`,'--noEmit','--strict','--skipLibCheck','--target','es2022','--moduleResolution','bundler','--module','esnext','--jsx','react-jsx','typography-slots/app.tsx'],{cwd,stdio:'inherit'});
    }
    const searchToolbar = resolve(cwd, 'search-toolbar'), searchToolbarOutput = resolve(`dist/search-toolbar-${kind}`);
    await cp(`examples/search-toolbar-${kind}`, searchToolbar, { recursive: true });
    const searchToolbarBuild = await build({ entryPoints: [`${searchToolbar}/app.${'tsx'}`], outdir: searchToolbarOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(searchToolbarBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'SearchToolbar escaped standalone install');
    assert(!Object.keys(searchToolbarBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'SearchToolbar requires private CSS');
    await copyFile(`${searchToolbar}/index.html`, `${searchToolbarOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${searchToolbarOutput}/theme-init.js`);
    await writeFile(`${searchToolbarOutput}/metafile.json`, JSON.stringify(searchToolbarBuild.metafile, null, 2));
    const searchToolbarTypes = 'search-toolbar-types.tsx';
    await copyFile(`tests/fixtures/${searchToolbarTypes}`, `${cwd}/${searchToolbarTypes}`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', searchToolbarTypes, ...(['search-toolbar/app.tsx'])], { cwd, stdio: 'inherit' });
    const choiceGroup = resolve(cwd, 'choice-group'), choiceGroupOutput = resolve(`dist/choice-group-${kind}`);
    await cp(`examples/choice-group-${kind}`, choiceGroup, { recursive: true });
    const choiceGroupBuild = await build({ entryPoints: [`${choiceGroup}/app.${'tsx'}`], outdir: choiceGroupOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(choiceGroupBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'ChoiceGroup escaped standalone install');
    assert(!Object.keys(choiceGroupBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'ChoiceGroup requires private CSS');
    await copyFile(`${choiceGroup}/index.html`, `${choiceGroupOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${choiceGroupOutput}/theme-init.js`);
    await writeFile(`${choiceGroupOutput}/metafile.json`, JSON.stringify(choiceGroupBuild.metafile, null, 2));
    const choiceGroupTypes = 'choice-group-types.tsx';
    await copyFile(`tests/fixtures/${choiceGroupTypes}`, `${cwd}/${choiceGroupTypes}`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', choiceGroupTypes, ...(['choice-group/app.tsx'])], { cwd, stdio: 'inherit' });
    const textInputs = resolve(cwd, 'text-inputs'), textInputsOutput = resolve(`dist/text-inputs-${kind}`);
    await cp(`examples/text-inputs-${kind}`, textInputs, { recursive: true });
    const textInputsBuild = await build({ entryPoints: [`${textInputs}/app.${'tsx'}`], outdir: textInputsOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(textInputsBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'TextInputs escaped standalone install');
    assert(!Object.keys(textInputsBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'TextInputs requires private CSS');
    await copyFile(`${textInputs}/index.html`, `${textInputsOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${textInputsOutput}/theme-init.js`);
    await writeFile(`${textInputsOutput}/metafile.json`, JSON.stringify(textInputsBuild.metafile, null, 2));
    const textInputsTypes = 'text-inputs-types.tsx';
    await copyFile(`tests/fixtures/${textInputsTypes}`, `${cwd}/${textInputsTypes}`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', textInputsTypes, ...(['text-inputs/app.tsx'])], { cwd, stdio: 'inherit' });
    const metricCard = resolve(cwd, 'metric-card'), metricCardOutput = resolve(`dist/metric-card-${kind}`);
    await cp(`examples/metric-card-${kind}`, metricCard, { recursive: true });
    const metricCardBuild = await build({ entryPoints: [`${metricCard}/app.${'tsx'}`], outdir: metricCardOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(metricCardBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'MetricCard consumer escaped standalone install');
    assert(!Object.keys(metricCardBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'MetricCard consumer requires private CSS');
    await copyFile(`${metricCard}/index.html`, `${metricCardOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${metricCardOutput}/theme-init.js`);
    await writeFile(`${metricCardOutput}/metafile.json`, JSON.stringify(metricCardBuild.metafile, null, 2));
    {
        await copyFile('tests/fixtures/metric-card-types.tsx', `${cwd}/metric-card-types.tsx`);
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'metric-card/app.tsx', 'metric-card-types.tsx'], { cwd, stdio: 'inherit' });
    }
    const headerControls = resolve(cwd, 'header-controls'), headerControlsOutput = resolve(`dist/header-controls-${kind}`);
    await cp(`examples/header-controls-${kind}`, headerControls, { recursive: true });
    const headerControlsBuild = await build({ entryPoints: [`${headerControls}/app.${'tsx'}`], outdir: headerControlsOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(headerControlsBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Header controls escaped standalone install');
    assert(!Object.keys(headerControlsBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Header controls require private CSS');
    await copyFile(`${headerControls}/index.html`, `${headerControlsOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${headerControlsOutput}/theme-init.js`);
    await writeFile(`${headerControlsOutput}/metafile.json`, JSON.stringify(headerControlsBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'header-controls/app.tsx'], { cwd, stdio: 'inherit' });
    const display = resolve(cwd, 'display'), displayOutput = resolve(`dist/display-${kind}`);
    await cp(`examples/display-${kind}`, display, { recursive: true });
    const displayBuild = await build({ entryPoints: [`${display}/app.${'tsx'}`], outdir: displayOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(displayBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Display consumer escaped standalone install');
    assert(!Object.keys(displayBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Display consumer needs private CSS');
    await copyFile(`${display}/index.html`, `${displayOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${displayOutput}/theme-init.js`);
    await writeFile(`${displayOutput}/metafile.json`, JSON.stringify(displayBuild.metafile, null, 2));
    await copyFile('examples/shared/display-image.svg', `${displayOutput}/display-image-a.svg`);
    const displayTypes = 'display-contract.tsx';
    await copyFile(`tests/fixtures/${displayTypes}`, `${cwd}/${displayTypes}`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', displayTypes, ...(['display/app.tsx'])], { cwd, stdio: 'inherit' });
    {
        await copyFile('tests/fixtures/display-hydration-tree.tsx', `${display}/hydration-tree.tsx`);
        await writeFile(`${display}/hydrate.tsx`, "import * as React from 'react';import {hydrateRoot} from 'react-dom/client';import {DisplayHydrationTree} from './hydration-tree';import '@coffeehc/xui-theme/style.css';(window as any).hydrationErrors=[];hydrateRoot(document.getElementById('root')!,<DisplayHydrationTree/>,{onRecoverableError:error=>(window as any).hydrationErrors.push(String(error))});");
        await writeFile(`${display}/server.tsx`, "import * as React from 'react';import {renderToString} from 'react-dom/server';import {DisplayHydrationTree} from './hydration-tree';console.log(renderToString(<DisplayHydrationTree/>));");
        await build({ entryPoints: [`${display}/server.tsx`], outfile: `${display}/server.mjs`, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
        const markup = execFileSync('node', [`${display}/server.mjs`], { cwd, encoding: 'utf8' }).trim();
        const hydrationBuild = await build({ entryPoints: [`${display}/hydrate.tsx`], outfile: `${displayOutput}/hydrate.js`, bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(hydrationBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Display hydration escaped standalone install');
        await writeFile(`${displayOutput}/hydrate.html`, '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="./hydrate.css"></head><body class="xui"><div id="root">' + markup + '</div><script type="module" src="./hydrate.js"></script></body></html>');
    }
    const strength = resolve(cwd, 'password-strength'), strengthOutput = resolve(`dist/password-strength-${kind}`);
    await mkdir(strength, { recursive: true });
    await copyFile(`tests/fixtures/password-strength-${'react.tsx'}`, `${strength}/app.${'tsx'}`);
    const strengthBuild = await build({ entryPoints: [`${strength}/app.${'tsx'}`], outdir: strengthOutput, bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, chunkNames: 'chunks/[name]-[hash]', define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(strengthBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Password strength consumer escaped standalone install');
    const strengthEngine = Object.entries(strengthBuild.metafile.outputs).find(([, value]) => value.entryPoint?.endsWith('/password-strength-worker.js'));
    assert(strengthEngine, 'Strength engine must remain a separate lazy chunk');
    const enginePath = resolve(strengthEngine[0]), engineGzip = gzipSync(await readFile(enginePath)).length;
    assert(engineGzip < 900000, 'Review strength dictionary growth rather than loading it into the initial entry');
    const initialStrength = Object.entries(strengthBuild.metafile.outputs).find(([file]) => file.endsWith('/app.js'));
    assert(initialStrength && !Object.keys(initialStrength[1].inputs).some(file => file.includes('@zxcvbn-ts/')), 'Initial entry must not contain strength dictionaries');
    const strengthOutputs = new Map(Object.entries(strengthBuild.metafile.outputs).map(([file, value]) => [resolve(file), value])), seenStrength = new Set();
    let initialGzip = 0;
    const checkInitialStrength = async (file) => {
        if (seenStrength.has(file))
            return;
        seenStrength.add(file);
        const output = strengthOutputs.get(file);
        assert(output, 'Unknown initial strength dependency');
        assert(!Object.keys(output.inputs).some(input => input.includes('@zxcvbn-ts/')), 'Static initial graph must not contain strength dictionaries');
        initialGzip += gzipSync(await readFile(file)).length;
        for (const imported of output.imports)
            if (!imported.external && imported.kind !== 'dynamic-import')
                await checkInitialStrength(resolve(imported.path));
    };
    await checkInitialStrength(resolve(initialStrength[0]));
    assert(initialGzip < (150000), 'Strength UI initial graph exceeded its isolated budget');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', `password-strength/app.${'tsx'}`], { cwd, stdio: 'inherit' });
    const strengthMetadata = { engine: strengthEngine[0], engineGzip, initialGzip };
    await writeFile(`${strengthOutput}/strength-bundle.json`, JSON.stringify(strengthMetadata, null, 2));
    console.log(`${kind} lazy password strength: ${JSON.stringify(strengthMetadata)}`);
    await writeFile(`${strengthOutput}/index.html`, '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="./app.css"></head><body class="xui"><main id="app"></main><script type="module" src="./app.js"></script></body></html>');
    const workspace = resolve(cwd, 'workspace'), workspaceOutput = resolve(`dist/workspace-${kind}`);
    await cp(`examples/workspace-${kind}`, workspace, { recursive: true });
    const workspaceBuild = await build({ entryPoints: [`${workspace}/app.${'tsx'}`], outdir: workspaceOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(workspaceBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Workspace consumer escaped standalone install');
    assert(!Object.keys(workspaceBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Workspace consumer requires private CSS');
    await copyFile(`${workspace}/index.html`, `${workspaceOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${workspaceOutput}/theme-init.js`);
    await writeFile(`${workspaceOutput}/metafile.json`, JSON.stringify(workspaceBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'workspace/app.tsx'], { cwd, stdio: 'inherit' });
    {
        await writeFile(`${workspace}/composition-types.tsx`, [
            "import * as React from 'react';",
            "import {AppShell,type ShellContentInset} from '@coffeehc/xui-react/layout';",
            "import {MenuLayout} from '@coffeehc/xui-react/menu-layout';",
            "import {ScrollArea,type ScrollAreaViewportProps} from '@coffeehc/xui-react/scroll-area';",
            "import {Surface,type SurfaceProps} from '@coffeehc/xui-react/feedback';",
            "import {InputGroup,type InputGroupRootProps} from '@coffeehc/xui-react/forms';",
            "import type {ShellContentInset as RootInset,ScrollAreaFocusMode,SurfaceProps as RootSurfaceProps,InputGroupRootProps as RootGroupProps} from '@coffeehc/xui-react';",
            "const contentInset:ShellContentInset='edge';const rootInset:RootInset=contentInset;const focusMode:ScrollAreaFocusMode='inset';",
            "const viewport:ScrollAreaViewportProps={focusMode};const surface:SurfaceProps={padding:'none'};const group:InputGroupRootProps={layout:'stacked'};const rootSurface:RootSurfaceProps=surface;const rootGroup:RootGroupProps=group;",
            "const control=<InputGroup.Root {...rootGroup}><InputGroup.Addon><InputGroup.Button>Attach</InputGroup.Button></InputGroup.Addon><InputGroup.Textarea ref={React.createRef<HTMLTextAreaElement>()} id='draft' name='draft' required readOnly aria-describedby='draft-help' onCompositionEnd={event=>event.currentTarget.value}/></InputGroup.Root>;",
            "const content=<Surface {...rootSurface}><ScrollArea.Root><ScrollArea.Viewport {...viewport}>{control}</ScrollArea.Viewport></ScrollArea.Root></Surface>;",
            "const shells=[<AppShell sidebar='Navigation' scrollMode='workspace' contentInset={rootInset}>{content}</AppShell>,<MenuLayout items={[]} scrollMode='workspace' contentInset={contentInset}>{content}</MenuLayout>];void shells;",
        ].join('\n'));
        execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'workspace/composition-types.tsx'], { cwd, stdio: 'inherit' });
    }
    const sidebarFooter = resolve(cwd, 'sidebar-footer'), sidebarFooterOutput = resolve(`dist/sidebar-footer-${kind}`);
    await cp(`examples/sidebar-footer-${kind}`, sidebarFooter, { recursive: true });
    await copyFile('examples/shared/sidebar-footer-model.ts', `${cwd}/shared/sidebar-footer-model.ts`);
    const sidebarFooterBuild = await build({ entryPoints: [`${sidebarFooter}/app.${'tsx'}`], outdir: sidebarFooterOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(sidebarFooterBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Sidebar footer consumer escaped its standalone install');
    assert(!Object.keys(sidebarFooterBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Sidebar footer consumer depends on private CSS');
    await copyFile(`${sidebarFooter}/index.html`, `${sidebarFooterOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${sidebarFooterOutput}/theme-init.js`);
    await writeFile(`${sidebarFooterOutput}/metafile.json`, JSON.stringify(sidebarFooterBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'sidebar-footer/app.tsx'], { cwd, stdio: 'inherit' });
    const http = resolve(cwd, 'http'), httpOutput = resolve(`dist/http-${kind}`);
    await cp(`examples/http-${kind}`, http, { recursive: true });
    await copyFile('examples/shared/http-model.ts', `${cwd}/shared/http-model.ts`);
    const httpBuild = await build({ entryPoints: [`${http}/app.${'tsx'}`], outdir: httpOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(httpBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'HTTP consumer escaped its standalone install');
    assert(!Object.keys(httpBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'HTTP consumer depends on private CSS');
    await copyFile(`${http}/index.html`, `${httpOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${httpOutput}/theme-init.js`);
    await writeFile(`${httpOutput}/metafile.json`, JSON.stringify(httpBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'http/app.tsx'], { cwd, stdio: 'inherit' });
    const keys = resolve(cwd, 'api-key'), keysOutput = resolve(`dist/api-key-${kind}`);
    await cp(`examples/api-key-${kind}`, keys, { recursive: true });
    for (const file of ['api-key-model.ts', 'api-key-labels.json'])
        await copyFile(`examples/shared/${file}`, `${cwd}/shared/${file}`);
    const keysBuild = await build({ entryPoints: [`${keys}/app.${'tsx'}`], outdir: keysOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '\"production\"' } });
    assert(Object.keys(keysBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'API key consumer escaped its standalone install');
    assert(!Object.keys(keysBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'API key consumer depends on private CSS');
    await copyFile(`${keys}/index.html`, `${keysOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${keysOutput}/theme-init.js`);
    await writeFile(`${keysOutput}/metafile.json`, JSON.stringify(keysBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', '--resolveJsonModule', 'api-key/app.tsx'], { cwd, stdio: 'inherit' });
    const logs = resolve(cwd, 'log'), logsOutput = resolve(`dist/log-${kind}`);
    await cp(`examples/log-${kind}`, logs, { recursive: true });
    for (const file of ['log-model.ts', 'log-labels.json'])
        await copyFile(`examples/shared/${file}`, `${cwd}/shared/${file}`);
    const logsBuild = await build({ entryPoints: [`${logs}/app.${'tsx'}`], outdir: logsOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '\"production\"' } });
    assert(Object.keys(logsBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Log consumer escaped its standalone install');
    assert(!Object.keys(logsBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Log consumer depends on private CSS');
    await copyFile(`${logs}/index.html`, `${logsOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${logsOutput}/theme-init.js`);
    await copyFile('examples/shared/log-reference.html', `${logsOutput}/reference.html`);
    await writeFile(`${logsOutput}/metafile.json`, JSON.stringify(logsBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', '--resolveJsonModule', 'log/app.tsx'], { cwd, stdio: 'inherit' });
    const businessLog = resolve(cwd, 'business-log'), businessLogOutput = resolve(`dist/business-log-${kind}`);
    await cp(`examples/business-log-${kind}`, businessLog, { recursive: true });
    for (const file of ['business-log-model.ts', 'business-log-labels.json'])
        await copyFile(`examples/shared/${file}`, `${cwd}/shared/${file}`);
    const businessLogBuild = await build({ entryPoints: [`${businessLog}/app.${'tsx'}`], outdir: businessLogOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(businessLogBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Business log consumer escaped its standalone install');
    assert(!Object.keys(businessLogBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Business log consumer depends on private CSS');
    await copyFile(`${businessLog}/index.html`, `${businessLogOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${businessLogOutput}/theme-init.js`);
    await copyFile('examples/shared/business-log-reference.html', `${businessLogOutput}/reference.html`);
    await writeFile(`${businessLogOutput}/metafile.json`, JSON.stringify(businessLogBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', '--resolveJsonModule', 'business-log/app.tsx'], { cwd, stdio: 'inherit' });
    const login = resolve(cwd, 'login'), loginOutput = resolve(`dist/login-${kind}`);
    await cp(`examples/login-${kind}`, login, { recursive: true });
    for (const file of ['login-model.ts', 'login-config.json', 'login-extensions.ts'])
        await copyFile(`examples/shared/${file}`, `${cwd}/shared/${file}`);
    const loginBuild = await build({ entryPoints: [`${login}/app.${'tsx'}`], outdir: loginOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(loginBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Login consumer escaped its standalone install');
    assert(!Object.keys(loginBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Login consumer depends on private CSS');
    await copyFile('examples/shared/login-mark.svg', `${loginOutput}/mark.svg`);
    await copyFile('examples/shared/login-visual.svg', `${loginOutput}/visual.svg`);
    await copyFile(`${login}/index.html`, `${loginOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${loginOutput}/theme-init.js`);
    await writeFile(`${loginOutput}/metafile.json`, JSON.stringify(loginBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', '--resolveJsonModule', 'login/app.tsx'], { cwd, stdio: 'inherit' });
    {
        const strictOutput = resolve('dist/login-react-strict');
        await build({ entryPoints: [`${login}/app.tsx`], outdir: strictOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' } });
        for (const file of ['index.html', 'theme-init.js', 'mark.svg', 'visual.svg'])
            await copyFile(`${loginOutput}/${file}`, `${strictOutput}/${file}`);
    }
    const passwordChange = resolve(cwd, 'password-change'), passwordChangeOutput = resolve(`dist/password-change-${kind}`);
    await cp(`examples/password-change-${kind}`, passwordChange, { recursive: true });
    const passwordChangeBuild = await build({ entryPoints: [`${passwordChange}/app.${'tsx'}`], outdir: passwordChangeOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(passwordChangeBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Password labels escaped the standalone install');
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'password-change/app.tsx'], { cwd, stdio: 'inherit' });
    await copyFile(`${passwordChange}/index.html`, `${passwordChangeOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${passwordChangeOutput}/theme-init.js`);
    await writeFile(`${passwordChangeOutput}/metafile.json`, JSON.stringify(passwordChangeBuild.metafile, null, 2));
    const adminSetup = resolve(cwd, 'admin-setup'), adminSetupOutput = resolve(`dist/admin-setup-${kind}`);
    await cp(`examples/admin-setup-${kind}`, adminSetup, { recursive: true });
    const adminBuild = await build({ entryPoints: [`${adminSetup}/app.${'tsx'}`], outdir: adminSetupOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(adminBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Admin setup escaped its standalone install');
    let adminHtml = await readFile(`${adminSetup}/index.html`, 'utf8');
    {
        const ssr = execFileSync('node', ['--input-type=module', '-e', "import React from 'react';import {renderToString} from 'react-dom/server';import {AdminSetupPage} from '@coffeehc/xui-react/admin-setup';console.log(renderToString(React.createElement(AdminSetupPage,{config:{productName:'Example',title:'创建管理员'},state:{status:'idle'},passwordLabels:{showPassword:'显示密码',hidePassword:'隐藏密码'},onSubmit:()=>{throw Error('SSR must not submit')}})));"], { cwd, encoding: 'utf8' });
        adminHtml = adminHtml.replace('<!--ssr-->', ssr.trim());
        execFileSync('node', [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'admin-setup/app.tsx'], { cwd, stdio: 'inherit' });
    }
    await writeFile(`${adminSetupOutput}/index.html`, adminHtml);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${adminSetupOutput}/theme-init.js`);
    const authPage = resolve(cwd, 'auth-page'), authPageOutput = resolve(`dist/auth-page-${kind}`);
    await cp(`examples/auth-page-${kind}`, authPage, { recursive: true });
    const authPageBuild = await build({ entryPoints: [`${authPage}/app.${'tsx'}`], outdir: authPageOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(authPageBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'AuthPage consumer escaped its standalone install');
    assert(!Object.keys(authPageBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'AuthPage consumer depends on private CSS');
    await copyFile(`${authPage}/index.html`, `${authPageOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${authPageOutput}/theme-init.js`);
    await copyFile('examples/shared/login-mark.svg', `${authPageOutput}/mark.svg`);
    await copyFile('examples/shared/login-visual.svg', `${authPageOutput}/visual.svg`);
    await writeFile(`${authPageOutput}/metafile.json`, JSON.stringify(authPageBuild.metafile, null, 2));
    execFileSync('node', [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'auth-page/app.tsx'], { cwd, stdio: 'inherit' });
    const capabilities = resolve(cwd, 'capabilities'), capabilitiesOutput = resolve(`dist/capabilities-${kind}`);
    await cp(`examples/capabilities-${kind}`, capabilities, { recursive: true });
    await copyFile('examples/shared/capability-model.ts', `${cwd}/shared/capability-model.ts`);
    const capabilityBuild = await build({ entryPoints: [`${capabilities}/app.${'tsx'}`], outdir: capabilitiesOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(capabilityBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Capability consumer escaped its standalone install');
    assert(!Object.keys(capabilityBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Capability consumer depends on private CSS');
    await copyFile(`${capabilities}/index.html`, `${capabilitiesOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${capabilitiesOutput}/theme-init.js`);
    await writeFile(`${capabilitiesOutput}/metafile.json`, JSON.stringify(capabilityBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'capabilities/app.tsx'], { cwd, stdio: 'inherit' });
    const grouped = resolve(cwd, 'grouped-search'), groupedOutput = resolve(`dist/grouped-search-${kind}`);
    await cp(`examples/grouped-search-${kind}`, grouped, { recursive: true });
    await copyFile('examples/shared/grouped-search-model.ts', `${cwd}/shared/grouped-search-model.ts`);
    const groupedBuild = await build({ entryPoints: [`${grouped}/app.${'tsx'}`], outdir: groupedOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(groupedBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Grouped search escaped standalone install');
    assert(!Object.keys(groupedBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Grouped search requires private CSS');
    await copyFile(`${grouped}/index.html`, `${groupedOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${groupedOutput}/theme-init.js`);
    await writeFile(`${groupedOutput}/metafile.json`, JSON.stringify(groupedBuild.metafile, null, 2));
    await copyFile('tests/fixtures/grouped-search-types.tsx', `${cwd}/grouped-search-types.tsx`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', ...(['grouped-search/app.tsx', 'grouped-search-types.tsx'])], { cwd, stdio: 'inherit' });
    const dataTable = resolve(cwd, 'data-table'), dataTableOutput = resolve(`dist/data-table-${kind}`);
    await cp(`examples/data-table-${kind}`, dataTable, { recursive: true });
    await copyFile('examples/shared/data-table-model.ts', `${cwd}/shared/data-table-model.ts`);
    const dataTableBuild = await build({ entryPoints: [`${dataTable}/app.${'tsx'}`], outdir: dataTableOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(dataTableBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'DataTable consumer escaped standalone install');
    assert(!Object.keys(dataTableBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'DataTable consumer requires private CSS');
    await copyFile(`${dataTable}/index.html`, `${dataTableOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${dataTableOutput}/theme-init.js`);
    await writeFile(`${dataTableOutput}/metafile.json`, JSON.stringify(dataTableBuild.metafile, null, 2));
    await copyFile('tests/fixtures/data-table-types.tsx', `${cwd}/data-table-types.tsx`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', ...(['data-table/app.tsx', 'data-table-types.tsx'])], { cwd, stdio: 'inherit' });
    const richNavigation = resolve(cwd, 'rich-navigation'), richNavigationOutput = resolve(`dist/rich-navigation-${kind}`);
    await cp(`examples/rich-navigation-${kind}`, richNavigation, { recursive: true });
    await copyFile('examples/shared/rich-navigation-model.ts', `${cwd}/shared/rich-navigation-model.ts`);
    const richNavigationBuild = await build({ entryPoints: [`${richNavigation}/app.${'tsx'}`], outdir: richNavigationOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(richNavigationBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Rich navigation escaped standalone install');
    assert(!Object.keys(richNavigationBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Rich navigation requires private CSS');
    await copyFile(`${richNavigation}/index.html`, `${richNavigationOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${richNavigationOutput}/theme-init.js`);
    await writeFile(`${richNavigationOutput}/metafile.json`, JSON.stringify(richNavigationBuild.metafile, null, 2));
    await copyFile('tests/fixtures/navigation-slots-types.tsx', `${cwd}/navigation-slots-types.tsx`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', ...(['rich-navigation/app.tsx', 'navigation-slots-types.tsx'])], { cwd, stdio: 'inherit' });
    await copyFile('examples/shared/page-composition-model.ts', `${cwd}/shared/page-composition-model.ts`);
    for (const name of ['card-group', 'calendar-month', 'menu-danger', 'row-events', 'date-time', 'page-composition']) {
        const directory = resolve(cwd, name), output = resolve('dist/' + name + '-' + kind);
        await cp('examples/' + name + '-' + kind, directory, { recursive: true });
        const result = await build({ entryPoints: [directory + '/app.' + ('tsx')], outdir: output, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
        assert(Object.keys(result.metafile.inputs).every(file => resolve(file).startsWith(cwd + '/')), 'Interaction consumer escaped standalone install');
        assert(!Object.keys(result.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Interaction consumer requires private CSS');
        await copyFile(directory + '/index.html', output + '/index.html');
        await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), output + '/theme-init.js');
        await writeFile(output + '/metafile.json', JSON.stringify(result.metafile, null, 2));
        {
            await copyFile('tests/fixtures/' + name + '-types.tsx', cwd + '/' + name + '-types.tsx');
            execFileSync('node', [root + '/node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', name + '/app.tsx', name + '-types.tsx'], { cwd, stdio: 'inherit' });
        }
    }
    const widgets = resolve(cwd, 'widgets'), widgetsOutput = resolve(`dist/widgets-${kind}`);
    await cp(`examples/widgets-${kind}`, widgets, { recursive: true });
    const widgetsBuild = await build({ entryPoints: [`${widgets}/app.${'tsx'}`], outdir: widgetsOutput, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(widgetsBuild.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Widget consumer escaped standalone install');
    assert(!Object.keys(widgetsBuild.metafile.inputs).some(file => file.endsWith('.css') && !file.includes('/@coffeehc/xui-theme/')), 'Widgets depend on private CSS');
    await copyFile(`${widgets}/index.html`, `${widgetsOutput}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${widgetsOutput}/theme-init.js`);
    await writeFile(`${widgetsOutput}/metafile.json`, JSON.stringify(widgetsBuild.metafile, null, 2));
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'widgets/app.tsx'], { cwd, stdio: 'inherit' });
    const foundation = resolve(cwd, 'foundation');
    await cp(`examples/foundation-${kind}`, foundation, { recursive: true });
    const output = resolve(`dist/foundation-${kind}`);
    const built = await build({ entryPoints: { app: `${foundation}/app.${'tsx'}`, 'heavy-panel': `${foundation}/heavy-panel.${'tsx'}` }, outdir: output, chunkNames: 'chunks/[name]-[hash]', bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', minify: true, metafile: true, define: { 'process.env.NODE_ENV': '"production"' } });
    assert(Object.keys(built.metafile.inputs).every(file => resolve(file).startsWith(`${cwd}/`)), 'Foundation consumer escaped its standalone install');
    assert(!Object.keys(built.metafile.inputs).some(file => file.endsWith('/layout.css') && !file.includes('/@coffeehc/xui-theme/')), 'Foundation depends on private demo layout CSS');
    await copyFile(`${foundation}/index.html`, `${output}/index.html`);
    await copyFile(require.resolve('@coffeehc/xui-runtime/init.js'), `${output}/theme-init.js`);
    await copyFile(require.resolve('@coffeehc/xui-theme/floating.css'), `${output}/optional.css`);
    execFileSync('node', [`${root}/node_modules/typescript/bin/tsc`, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', '--jsx', 'react-jsx', 'foundation/app.tsx', 'foundation/heavy-panel.tsx'], { cwd, stdio: 'inherit' });
    const files = built.metafile.outputs;
    const initial = new Set();
    function visit(path) {
        const normalized = resolve(path);
        if (initial.has(normalized))
            return;
        initial.add(normalized);
        for (const item of files[Object.keys(files).find(file => resolve(file) === normalized)]?.imports ?? [])
            if (!item.external && item.kind === 'import-statement')
                visit(item.path);
    }
    visit(`${output}/app.js`);
    let initialJs = 0, initialJsGzip = 0;
    for (const file of initial) {
        const bytes = await readFile(file);
        initialJs += bytes.length;
        initialJsGzip += gzipSync(bytes).length;
    }
    const initBytes = await readFile(`${output}/theme-init.js`);
    initialJs += initBytes.length;
    initialJsGzip += gzipSync(initBytes).length;
    const html = await readFile(`${output}/index.html`);
    const inline = [...html.toString().matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]).filter(Boolean);
    const inlineJs = inline.reduce((sum, text) => sum + Buffer.byteLength(text), 0), inlineJsGzip = inline.reduce((sum, text) => sum + gzipSync(text).length, 0);
    initialJs += inlineJs;
    initialJsGzip += inlineJsGzip;
    const css = await readFile(`${output}/app.css`), cssGzip = gzipSync(css).length;
    assert(cssGzip <= performance.budgets.criticalCssGzip, `Critical CSS gzip budget: ${cssGzip}/${performance.budgets.criticalCssGzip}`);
    assert(initialJsGzip <= performance.budgets['reactInitialJsGzip'], `Initial JS gzip budget: ${initialJsGzip}/${performance.budgets['reactInitialJsGzip']}`);
    assert(!initial.has(`${output}/heavy-panel.js`), 'Optional panel included in initial graph');
    performance.consumers.push({ kind, initialJs, initialJsGzip, inlineJs, inlineJsGzip, htmlGzip: gzipSync(html).length, criticalCss: css.length, criticalCssGzip: cssGzip, initialFiles: [...initial].map(file => file.replace(output + '/', '')).concat('theme-init.js'), optionalPanel: (await readFile(`${output}/heavy-panel.js`)).length });
    await writeFile(`${output}/metafile.json`, JSON.stringify(built.metafile, null, 2));
    for (const entry of ['', '/button']) {
        const only = await build({ stdin: { contents: `import {Button} from '@coffeehc/xui-react${entry}';window.xuiButton=Button;`, resolveDir: cwd, sourcefile: 'button-only.js' }, bundle: true, format: 'esm', minify: true, write: false, metafile: true, platform: 'browser', target: 'es2022', define: { 'process.env.NODE_ENV': '"production"' } });
        const contributing = Object.values(only.metafile.outputs).flatMap(file => Object.entries(file.inputs).filter(([, data]) => data.bytesInOutput > 0).map(([path, data]) => ({ path, bytesInOutput: data.bytesInOutput })));
        assert(!contributing.some(file => /\/(?:dialog|tabs|menu|popover|combobox|select|toast)\/|\/dist\/(?:toggle-group|avatar|accordion|scroll-area|calendar|command|widgets-dom|sheet|alert-dialog|context-menu|download|api-key-http|business-log-http|auth|login|login-dom|business-log|business-log-dom|structured-log|structured-log-dom|api-key|api-key-dom|dialog|tabs|menu|menu-layout|navigation|popover|combobox|select|toast)\.js/.test(file.path)), 'Button-only includes unrelated component code');
        const bytes = only.outputFiles[0].contents, minified = bytes.length, gzip = gzipSync(bytes).length;
        assert(minified <= performance.budgets.buttonMinified && gzip <= performance.budgets.buttonGzip, 'Button-only size budget');
        performance.button.push({ entry: entry || 'root', minified, gzip, contributing: contributing.map(file => ({ ...file, path: file.path.replace(cwd + '/', '') })) });
    }
    console.log(`${kind}: tarballs installed, built exports and types consumed; no source aliases.`);
}
await writeFile('.artifacts/performance-baseline.json', JSON.stringify(performance, null, 2) + '\n');
console.log('Public layouts, dynamic panel entries, Button-only contribution and gzip gates passed.');
