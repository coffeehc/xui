import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import postcss from 'postcss';
import ts from 'typescript';

const kebab = name => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const where = context => typeof context === 'string' ? context : [context?.file, context?.line, context?.selector].filter(Boolean).join(':');
const dimensional = /^(?:(?:min|max)-)?(?:width|height|inline-size|block-size)$|^(?:flex-basis|inset(?:-.+)?|top|right|bottom|left)$/;
const colors = /color|background|^(?:fill|stroke)$|^(?:border|outline)(?!.*(?:radius|offset|width|style))|shadow/;
const numeric = /(?<![\w-])[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?(?:[a-z]+|%)?/gi;

/** Check a consumer declaration, never a declaration in the central token block. */
export function checkDesignDeclaration(property, input, context = '') {
  const prop = kebab(property), value = String(input).trim();
  const fail = message => assert.fail(`${where(context)} ${prop}: ${value}: ${message}`.trim());
  // One documented public composition alias, not permission to redefine defaults.
  const workspaceTableMinimum = prop === '--layout-workspace-content-min-block-size' && value === 'var(--data-table-min-block-size)';
  if (prop.startsWith('--') && !workspaceTableMinimum) fail('Design defaults belong only in the central token contract');
  if (/var\(\s*--(?:base|palette)-/i.test(value)) fail('Consumers must use semantic tokens');
  if (prop === 'content' && /^(?:["'][^"']*["']|none|normal)$/.test(value)) return;
  // A fallback is another default, even when its primary token is valid.
  let rest = value.replace(/var\(\s*--[\w-]+\s*\)/g, 'TOKEN');
  if (/var\s*\(/i.test(rest)) fail('Use a single token without a fallback');
  if (/#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\(/i.test(rest)) fail('Raw color belongs in a token');
  if (/^(?:font|font-family|font-weight|font-size|line-height|letter-spacing)$/.test(prop)) {
    const words = rest.replace(/TOKEN|\b(?:inherit|unset)\b|[\s/]/g, '');
    if (words) fail('Typography must reference semantic tokens');
    return;
  }
  if (/^(?:border(?:-.+)?-width|border-width|outline-width)$/.test(prop) && /\b(?:thin|medium|thick)\b/i.test(rest)) fail('Border widths must reference semantic tokens');
  if (colors.test(prop)) {
    const words = rest.replace(/TOKEN|color-mix\(|linear-gradient\(|\bin\s+oklab\b|\b(?:transparent|currentcolor|none|solid|dashed|dotted|double|inherit|initial|unset|revert|revert-layer)\b|[-+\d.%\s(),]/gi, '');
    if (words && prop !== 'border-collapse') fail('Color, border and shadow values must reference tokens');
  }
  // Structural arithmetic: negate a token, or subtract the same viewport inset
  // on both sides. No general permission for multiplication by 2 is granted.
  rest = rest.replace(/calc\(\s*(?:-1\s*\*\s*TOKEN|TOKEN\s*\*\s*-1)\s*\)/gi, 'TOKEN');
  if (dimensional.test(prop)) rest = rest.replace(/calc\(\s*100(?:vw|dvh)\s*-\s*(?:TOKEN\s*\*\s*2|2\s*\*\s*TOKEN)\s*\)/gi, 'TOKEN');
  if (/^grid-(?:template-(?:columns|rows)|auto-(?:columns|rows))$/.test(prop)) {
    // Two equal tracks divide the available container after one semantic gap.
    rest = rest.replace(/calc\(\s*\(\s*100%\s*-\s*TOKEN\s*\)\s*\/\s*2\s*\)/gi, 'TRACK');
    rest = rest.replace(/repeat\(\s*[1-9]\d*\s*,/gi, 'repeat(').replace(/(?<![\w-])(?:\d*\.)?\d+fr\b/gi, 'TRACK').replace(/(?<![\w.-])100%/g, 'FULL');
  }
  if (/^grid-(?:column|row)(?:-(?:start|end))?$/.test(prop)) rest = rest.replace(/\b(?:span\s+)?[1-9]\d*\b/g, 'TRACK');
  if (prop === 'clip-path' && /^inset\(\s*50%\s*\)$/.test(rest)) return;
  if (/^(?:top|right|bottom|left|inset(?:-.+)?)$/.test(prop)) rest = rest.replace(/(?<![\w.-])50%/g, 'CENTER');
  if (prop === 'transform') rest = rest.replace(/translate(?:[XY])?\(\s*-?50%(?:\s*,\s*-?50%)?\s*\)/gi, 'CENTER');
  if (dimensional.test(prop)) rest = rest.replace(/(?<![\w.-])100(?:%|vw\b|dvh\b)/gi, 'FULL');
  const allowOne = /^(?:opacity|scale|flex|flex-grow|flex-shrink|order)$/.test(prop);
  // Scale endpoints express fully absent/present geometry, not a scale recipe.
  if (prop === 'transform') rest = rest.replace(/scale\(\s*[01]\s*\)|rotate\(\s*0deg\s*\)/gi, 'ENDPOINT');
  for (const match of rest.matchAll(numeric)) {
    if (match[0] === '0' || allowOne && match[0] === '1') continue;
    fail(`Literal ${match[0]} belongs in a semantic token`);
  }
}

const breakpointValues = new Set(['48rem', '47.999rem', '640px', '40rem']);
function checkQuery(query, context) {
  assert(!/var\s*\(/i.test(query), `${where(context)} Media queries cannot consume CSS variables`);
  // The login contract declares only max-height:30rem, not a new width breakpoint.
  const checked = query.replace(/\bmax-height\s*:\s*30rem\b/gi, '');
  for (const match of checked.matchAll(/(?:min-|max-)?(?:width|height)\s*:\s*([^\s)]+)/gi))
    assert(breakpointValues.has(match[1]), `${where(context)} Undeclared media breakpoint ${match[1]}`);
  for (const match of checked.matchAll(/[-+]?(?:\d*\.\d+|\d+)(?:px|rem|em|vw|vh)\b/gi))
    assert(breakpointValues.has(match[0]), `${where(context)} Undeclared media breakpoint ${match[0]}`);
}

async function filesUnder(path) {
  let entries;
  try { entries = await readdir(path, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const name = resolve(path, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(name));
    else if (entry.isFile()) files.push(name);
  }
  return files.sort();
}

/** Read-only audit. Options.root supports isolated regression fixtures. */
export async function auditDesignSources({ root = process.cwd(), availableTokens } = {}) {
  const paths = (await Promise.all(['packages/theme/src', 'packages/runtime/src', 'packages/ui-react/src', 'examples', 'docs', '.agents/skills'].map(dir => filesUnder(resolve(root, dir))))).flat();
  for (const entry of await readdir(root, { withFileTypes: true })) if (entry.isFile() && extname(entry.name) === '.md') paths.push(resolve(root, entry.name));
  const errors = [], exceptions = new Set();
  let tokens = availableTokens ? new Set(availableTokens[Symbol.iterator] ? availableTokens : Object.keys(availableTokens)) : undefined;
  try {
    const contract = await readFile(resolve(root, 'docs/DESIGN.md'), 'utf8');
    const defaults = contract.split('<!-- design-default-css:start -->')[1]?.split('<!-- design-default-css:end -->')[0];
    if (defaults && !tokens) tokens = new Set([...defaults.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let declarations = 0, files = 0;
  const check = (prop, value, context) => {
    declarations++;
    try {
      checkDesignDeclaration(prop, value, context);
      if (tokens) for (const match of String(value).matchAll(/var\(\s*(--[\w-]+)/g)) {
        const property = kebab(prop), expression = String(value).replace(/\s+/g, '');
        // Base UI Positioner supplies both measurements; the native popover
        // controller supplies anchor width and applies its own collision cap.
        const selectionAnchor = match[1] === '--anchor-width' && property === 'inline-size' && context.selector === '.xui-select-popup,.xui-combobox-popup' && expression === 'max(var(--anchor-width),var(--popover-width))';
        const selectionAvailable = match[1] === '--available-width' && property === 'max-inline-size' && context.selector === '.xui-positioner :is(.xui-select-popup,.xui-combobox-popup)' && expression === 'min(var(--available-width),calc(100vw-var(--layout-viewport-inset)*2))';
        const sideAvailable = match[1] === '--available-width' && property === 'max-inline-size' && context.selector === ".xui-positioner:is([data-side='left'],[data-side='right']) .xui-floating" && expression === 'min(calc(var(--available-width)-var(--floating-offset)-var(--floating-offset)),calc(100vw-var(--layout-viewport-inset)-var(--layout-viewport-inset)))';
        const peer = context.file === 'packages/theme/src/floating.css' && (selectionAnchor || selectionAvailable || sideAvailable || ({ '--available-height': 'max-block-size', '--toast-swipe-movement-x': 'transform', '--toast-swipe-movement-y': 'transform' })[match[1]] === property);
        assert(tokens.has(match[1]) || peer, `${where(context)} Undefined semantic token ${match[1]}`);
        if (peer) exceptions.add(`${context.file}: peer measurement ${match[1]}`);
      }
    } catch (error) { errors.push(error.message); }
  };
  const query = (value, context) => { try { checkQuery(value, context); exceptions.add('Explicit media-query breakpoints'); } catch (error) { errors.push(error.message); } };
  function css(text, file, offset = 0) {
    try {
      const ast = postcss.parse(text, { from: file });
      ast.walkDecls(decl => check(decl.prop, decl.value, { file, line: offset + decl.source.start.line, selector: decl.parent.selector }));
      ast.walkAtRules('media', rule => query(rule.params, { file, line: offset + rule.source.start.line }));
    } catch (error) { errors.push(`${file}: ${error.message}`); }
  }
  function html(text, file, offset = 0) {
    for (const tag of text.matchAll(/<[A-Za-z][^>]*>/g)) {
      const line = offset + text.slice(0, tag.index).split('\n').length;
      for (const style of tag[0].matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/g)) css(`x{${style[2]}}`, file, line - 1);
      // Presentation attributes on image/SVG content also determine rendered
      // sizes. Geometry (viewBox, d, x/y, rx/ry) is deliberately not CSS.
      for (const attribute of tag[0].matchAll(/\b(width|height|stroke-width|stroke|fill)\s*=\s*(["'])(.*?)\2/g)) check(attribute[1], attribute[3], { file, line });
    }
    for (const style of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) css(style[1], file, offset + text.slice(0, style.index).split('\n').length - 1);
  }
  function source(text, file, offset = 0) {
    const kind = file.endsWith('.ts') ? ts.ScriptKind.TS : file.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TSX;
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
    const bindings = new Map(), stateSetters = new Map();
    const loc = node => ({ file, line: offset + ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 });
    function gather(node) {
      if (ts.isVariableDeclaration(node) && node.initializer) {
        if (ts.isIdentifier(node.name)) bindings.set(node.name.text, node.initializer);
        if (ts.isArrayBindingPattern(node.name) && ts.isCallExpression(node.initializer) && /(?:^|\.)useState$/.test(node.initializer.expression.getText(ast))) {
          const [state, setter] = node.name.elements;
          if (state && setter && ts.isBindingElement(state) && ts.isBindingElement(setter)) {
            stateSetters.set(state.name.getText(ast), setter.name.getText(ast));
            if (node.initializer.arguments[0]) bindings.set(state.name.getText(ast), node.initializer.arguments[0]);
          }
        }
      }
      ts.forEachChild(node, gather);
    }
    gather(ast);
    const unwrap = node => ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ? unwrap(node.expression) : node;
    function expression(prop, original, seen = new Set()) {
      const node = unwrap(original);
      if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) { check(prop, node.text, loc(node)); return; }
      if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) { check(prop, node.getText(ast), loc(node)); return; }
      if (ts.isConditionalExpression(node)) { expression(prop, node.whenTrue, seen); expression(prop, node.whenFalse, seen); return; }
      if (ts.isBinaryExpression(node)) { expression(prop, node.left, seen); expression(prop, node.right, seen); return; }
      if (ts.isCallExpression(node) && ['String', 'Number'].includes(node.expression.getText(ast))) { for (const argument of node.arguments) expression(prop, argument, seen); return; }
      if (ts.isIdentifier(node) && !seen.has(node.text)) {
        const next = new Set(seen).add(node.text), binding = bindings.get(node.text);
        if (binding) expression(prop, binding, next);
        const setter = stateSetters.get(node.text);
        if (setter) {
          const calls = value => { if (ts.isCallExpression(value) && value.expression.getText(ast) === setter && value.arguments[0]) expression(prop, value.arguments[0], next); ts.forEachChild(value, calls); };
          calls(ast);
        }
        return; // Public caller-provided style/offset values remain extension data.
      }
      if (ts.isTemplateExpression(node)) {
        const raw = node.getText(ast);
        let hasNumericOffset = false;
        const scanNumber = value => { if (ts.isNumericLiteral(value) && Number(value.text) !== 0) hasNumericOffset = true; ts.forEachChild(value, scanNumber); };
        for (const span of node.templateSpans) scanNumber(span.expression);
        const measuredPosition = file === 'packages/runtime/src/dom.ts' && /^(?:left|top|maxWidth|maxHeight|--anchor-width|--available-height)$/.test(prop) && /^`\$\{[\s\S]+\}px`$/.test(raw) && /(?:anchor\.|contextPoint|win\.(?:innerWidth|innerHeight)|box\.|right-left|bottom-top|down\?below:above|trigger\.getBoundingClientRect\(\)\.width)/.test(raw) && !hasNumericOffset && !/["']\d+(?:px|rem)["']/.test(raw);
        const measuredSidebar = ['packages/runtime/src/menu-layout.ts', 'packages/ui-react/src/layout.tsx'].includes(file) && prop === 'blockSize' && /^`max\(var\(--nav-sidebar-min-height\), calc\(100dvh - \$\{(?:header|headerNode)\.getBoundingClientRect\(\)\.height\}px\)\)`$/.test(raw);
        const measuredTableTrack = file === 'packages/runtime/src/data-table.ts' && prop === 'gridTemplateRows' && raw === '`auto minmax(${minimum}px, 1fr) auto`';
        const measuredTableMinimum = file === 'packages/runtime/src/data-table.ts' && prop === 'minBlockSize' && ['`${componentMinimum}px`', '`max(var(--data-table-min-block-size), ${componentMinimum}px)`'].includes(raw);
        // Explicit positive image dimensions are consumer data, validated before DOM writes.
        const imageWidth = file === 'packages/runtime/src/display-dom.ts' && prop === 'width' && raw === '`${options.width}px`';
        if (measuredPosition || measuredSidebar || measuredTableTrack || measuredTableMinimum || imageWidth) { exceptions.add(`${file}: measured ${prop}`); return; }
        errors.push(`${where(loc(node))} ${prop}: Unreviewed dynamic style template ${raw}`);
      }
    }
    function styleObject(original, seen = new Set()) {
      const node = unwrap(original);
      if (ts.isConditionalExpression(node)) { styleObject(node.whenTrue, seen); styleObject(node.whenFalse, seen); }
      else if (ts.isIdentifier(node) && !seen.has(node.text) && bindings.has(node.text)) styleObject(bindings.get(node.text), new Set(seen).add(node.text));
      else if (ts.isObjectLiteralExpression(node)) for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && !ts.isComputedPropertyName(prop.name)) expression(prop.name.getText(ast).replace(/^['"]|['"]$/g, ''), prop.initializer);
        if (ts.isShorthandPropertyAssignment(prop)) expression(prop.name.text, prop.name);
        if (ts.isSpreadAssignment(prop)) styleObject(prop.expression, seen);
      }
    }
    function visit(node) {
      if (ts.isJsxAttribute(node) && node.initializer) {
        const name = node.name.getText(ast), value = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
        if (value && name === 'style') {
          if (ts.isStringLiteralLike(value)) css(`x{${value.text}}`, file, loc(node).line - 1);
          else styleObject(value);
        }
        if (value && /^(?:width|height|strokeWidth|stroke|fill)$/.test(name)) expression(name, value);
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        if (ts.isPropertyAccessExpression(node.left) && /\.style$/.test(node.left.expression.getText(ast))) {
          if (node.left.name.text === 'cssText' && ts.isStringLiteralLike(node.right)) css(`x{${node.right.text}}`, file, loc(node).line - 1);
          else expression(node.left.name.text, node.right);
        }
        if (ts.isElementAccessExpression(node.left) && /\.style$/.test(node.left.expression.getText(ast)) && ts.isStringLiteralLike(node.left.argumentExpression)) expression(node.left.argumentExpression.text, node.right);
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text, args = node.arguments;
        if (method === 'matchMedia' && args[0] && ts.isStringLiteralLike(args[0])) query(args[0].text, loc(node));
        if (method === 'setProperty' && /\.style$/.test(node.expression.expression.getText(ast)) && args[0] && ts.isStringLiteralLike(args[0]) && args[1]) expression(args[0].text, args[1]);
        if (method === 'setAttribute' && args[0] && ts.isStringLiteralLike(args[0]) && args[1]) {
          if (args[0].text === 'style' && ts.isStringLiteralLike(args[1])) css(`x{${args[1].text}}`, file, loc(node).line - 1);
          if (/^(?:width|height|stroke-width|stroke|fill)$/.test(args[0].text)) expression(args[0].text, args[1]);
        }
        if (node.expression.getText(ast) === 'Object.assign' && args[0] && /\.style$/.test(args[0].getText(ast))) for (const value of args.slice(1)) styleObject(value);
      }
      if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
        const raw = ts.isTemplateExpression(node) ? node.getText(ast).slice(1, -1) : node.text;
        // Standalone image resources have their own coordinate/color space.
        const imageData = /data:image\/svg\+xml/.test(raw) || node.parent && ts.isCallExpression(node.parent) && node.parent.expression.getText(ast) === 'encodeURIComponent' && /<svg/.test(raw);
        if (imageData) exceptions.add(`${file}: standalone SVG image data`);
        else if (/<(?:svg|\w+\b[^>]*\bstyle\s*=)/i.test(raw)) html(raw, file, loc(node).line - 1);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  for (const path of paths) {
    const extension = extname(path), file = relative(root, path).replaceAll('\\', '/');
    if (!['.css', '.ts', '.tsx', '.js', '.html', '.md'].includes(extension)) continue;
    files++;
    const text = await readFile(path, 'utf8');
    if (extension === '.css') css(text, file);
    else if (extension === '.html') html(text, file);
    else if (extension === '.md') {
      // Central defaults and documented product overrides are the two allowed
      // definition blocks; all executable consumer examples are checked.
      const document = file === 'docs/DESIGN.md' ? text.replace(/<!-- design-(?:default|product)-css:start -->[\s\S]*?<!-- design-(?:default|product)-css:end -->/g, block => block.replace(/[^\n]/g, ' ')) : text;
      for (const fence of document.matchAll(/(?:```|~~~)(css|js|javascript|ts|typescript|tsx|jsx|html)\s*\n([\s\S]*?)(?:```|~~~)/g)) {
        const offset = document.slice(0, fence.index).split('\n').length;
        if (fence[1] === 'css') css(fence[2], file, offset);
        else if (fence[1] === 'html') html(fence[2], file, offset);
        else source(fence[2], file, offset);
      }
      for (const inline of document.matchAll(/`([^`\n]*(?:style\s*=|\.style\.)[^`\n]*)`/g)) source(/^style\s*=/.test(inline[1]) ? `<div ${inline[1]} />` : inline[1], file, document.slice(0, inline.index).split('\n').length - 1);
      for (const inline of document.matchAll(/`([^`\n]*<[A-Za-z][^`\n]*\b(?:width|height|stroke-width|strokeWidth|fill|stroke)\s*=[^`\n]*)`/g)) {
        const offset = document.slice(0, inline.index).split('\n').length - 1;
        if (/\b(?:strokeWidth|className)\s*=/.test(inline[1])) source(inline[1], file, offset);
        else html(inline[1], file, offset);
      }
    } else source(text, file);
  }
  assert.equal(errors.length, 0, `Design value audit failed (${errors.length}):\n${[...new Set(errors)].join('\n')}`);
  return { files, declarations, exceptions: [...exceptions].sort() };
}
