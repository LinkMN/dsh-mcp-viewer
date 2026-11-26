import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));

const hookState = new Map();
const effectSeen = new Set();
let hookCursor = 0;
let currentPath = 'root';
let rerender = null;

const React = {
  createElement(type, props, ...children) { return { type, props: props || {}, children: children.flat(Infinity) }; },
  useState(initial) {
    const slot = currentPath + '#' + hookCursor++;
    if (!hookState.has(slot)) hookState.set(slot, typeof initial === 'function' ? initial() : initial);
    const set = (next) => {
      const value = typeof next === 'function' ? next(hookState.get(slot)) : next;
      if (Object.is(value, hookState.get(slot))) return;
      hookState.set(slot, value);
      if (rerender) rerender();
    };
    return [hookState.get(slot), set];
  },
  useCallback(fn) { hookCursor++; return fn; },
  useEffect(fn) {
    const slot = currentPath + '@' + hookCursor++;
    if (effectSeen.has(slot)) return;
    effectSeen.add(slot);
    if (typeof fn === 'function') fn();
  },
  useRef(initial) { hookCursor++; return { current: initial }; },
};

function visit(node, path) {
  if (node === null || node === undefined || typeof node === 'boolean') return node;
  if (typeof node === 'string' || typeof node === 'number') return node;
  if (Array.isArray(node)) return node.map((child, i) => visit(child, path + '.' + i));
  if (typeof node !== 'object') return node;
  if (typeof node.type === 'function') {
    const sp = currentPath, sc = hookCursor;
    currentPath = path; hookCursor = 0;
    const rendered = node.type(node.props);
    currentPath = sp; hookCursor = sc;
    return visit(rendered, path + '/c');
  }
  return { type: node.type, props: node.props, children: visit(node.children, path) };
}

function mount(Component, props) {
  let tree = null;
  const render = () => { hookCursor = 0; currentPath = 'root'; tree = visit({ type: Component, props: props || {}, children: [] }, 'root'); return tree; };
  hookState.clear();
  effectSeen.clear();
  rerender = () => render();
  render();
  return { tree: () => tree, render: () => rerender() };
}

function findAll(node, pred, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const c of node) findAll(c, pred, out); return out; }
  if (typeof node.type === 'string' && pred(node)) out.push(node);
  findAll(node.children, pred, out);
  return out;
}

function textOf(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node !== 'object') return '';
  return textOf(node.children);
}

let registered = null;
const appended = [];
const sandbox = {
  window: { __ModuleLoader__: { load(b) { registered = b; } } },
  document: { getElementById: () => null, createElement: () => ({ id: '', textContent: '' }), head: { appendChild: (e) => appended.push(e) } },
  fetch: undefined,
  console,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8'), sandbox, { filename: 'lib/client.js' });

if (registered === null) throw new Error('bundle never registered');
const surface = registered.factory((n) => { if (n === 'react') return React; throw new Error('unexpected require: ' + n); });

/* 槽位 */
const entries = [];
const ctx2 = { slots: { inject: (n, fn) => fn(), register: (m, C) => { entries.push({ m, C }); return () => {}; } } };
surface.apply(ctx2);
if (entries.length !== 3) throw new Error('默认只应注册 3 个槽位, got ' + entries.length + ': ' + entries.map((e) => e.m.name));
if (entries.some((e) => e.m.name === 'main' || e.m.name === 'sidebar.panellist')) throw new Error('默认不该出现侧边栏槽位');
const pluginCard = entries.find((e) => e.m.name === 'plugins.bundle.config');
if (!pluginCard) throw new Error('插件配置卡未注册');

/* 打开开关后才注册 main + sidebar.panellist，且两处 key 一致 */
const beforeSidebar = entries.length;
surface.__internals.applySidebar(true, ctx2);
const mainSlot = entries.find((e) => e.m.name === 'main');
const panelRow = entries.find((e) => e.m.name === 'sidebar.panellist');
if (!mainSlot || !panelRow) throw new Error('打开开关后侧边栏槽位未注册');
if (mainSlot.m.key !== panelRow.m.id) throw new Error('main 的 key 必须等于 nav 行的 id');
if (panelRow.m.id !== 'mcp-viewer') throw new Error('面板 id 不对');
if (entries.length !== beforeSidebar + 2) throw new Error('应只多出 2 个槽位, got ' + (entries.length - beforeSidebar));

/* 关掉开关：两个 disposer 都被调用，不再留下导航行 */
let disposed = 0;
surface.__internals.applySidebar(false, ctx2);
if (surface.__internals.applySidebar(false, ctx2) !== false) throw new Error('applySidebar 应返回 false');
const section = entries.find((e) => e.m.name === 'settings.section');
const icon = entries.find((e) => e.m.name === 'settings.section.icon');
if (!section || !icon) throw new Error('missing slot');
if (section.m.id !== icon.m.id) throw new Error('icon id must match');
if (section.m.label() !== 'MCP 服务') throw new Error('label: ' + section.m.label());
if (appended.length !== 1) throw new Error('styles not installed');

/* 服务器行：默认折叠，头像首字母，副标题带工具数 */
const toggles = [];
const server = {
  id: 'mcp-miora', serverName: 'miora', enabled: true, transport: 'stdio', pendingRestart: false, added: true,
  tools: Array.from({ length: 8 }, (_, i) => ({ name: 'miora_tool_' + i, publicName: 'mcp__miora__t' + i, description: 'd' + i })),
};
const toolCalls = [];
const removed = [];
const row = mount(surface.__internals.ServerRow, {
  server, canToggle: true, busy: false, busyTool: '',
  onToggle: (s, e) => toggles.push({ id: s.id, enabled: e }),
  onTool: (s, t, e) => toolCalls.push({ server: s.serverName, tool: t.name, enabled: e }),
  onRemove: (s) => removed.push(s.id),
});
const closed = textOf(row.tree());
if (!closed.includes('miora')) throw new Error('row lost the name');
if (!closed.includes('来自插件 mcp-miora · 8/8 个工具已启用')) throw new Error('subtitle wrong: ' + closed);
if (closed.includes('miora_tool_0')) throw new Error('默认必须折叠，不应显示工具标签');
if (!closed.includes('8/8 个工具已启用')) throw new Error('副标题计数错误: ' + closed);
const disc = findAll(row.tree(), (n) => n.props.className === 'mq__disclose')[0];
if (!disc || disc.props['aria-expanded'] !== 'false') throw new Error('disclose wrong');

/* 开关 */
const sw = findAll(row.tree(), (n) => n.props.className === 'mq__switch')[0];
if (!sw || sw.props.role !== 'switch' || sw.props['aria-checked'] !== 'true') throw new Error('switch wrong');
sw.props.onClick();
if (toggles.length !== 1 || toggles[0].enabled !== false) throw new Error('switch callback wrong');


/* 展开后有工具标签（重新取节点：state 更新后旧引用失效） */
findAll(row.tree(), (n) => n.props.className === 'mq__disclose')[0].props.onClick();
const opened = textOf(row.tree());
if (!opened.includes('miora_tool_0')) throw new Error('展开后应显示工具标签');
const chips = findAll(row.tree(), (n) => String(n.props.className || '').split(' ').indexOf('mq__chip') >= 0);
if (chips.length !== 8) throw new Error('expected 8 chips, got ' + chips.length);

/* 工具标签本身是开关：点一下回调，并带 aria-pressed */
if (chips[0].props['aria-pressed'] !== 'true') throw new Error('工具标签应有 aria-pressed=true');
chips[0].props.onClick();
if (toolCalls.length !== 1 || toolCalls[0].tool !== 'miora_tool_0' || toolCalls[0].enabled !== false) {
  throw new Error('工具开关回调错误: ' + JSON.stringify(toolCalls));
}

/* 删除按钮：所有条目都显示（对齐），可点击 */
const del = findAll(row.tree(), (n) => n.props.className === 'mq__del')[0];
if (!del) throw new Error('删除按钮应显示');
if (del.props.disabled !== false) throw new Error('删除按钮不应禁用');
del.props.onClick();
if (removed.length !== 1 || removed[0] !== 'mcp-miora') throw new Error('删除回调错误: ' + JSON.stringify(removed));
const nativeRow = mount(surface.__internals.ServerRow, {
  server: Object.assign({}, server, { added: false }), canToggle: true, busy: false,
  onToggle: () => {}, onTool: () => {}, onRemove: (s) => removed.push(s.id),
});
if (findAll(nativeRow.tree(), (n) => n.props.className === 'mq__del').length !== 1) {
  throw new Error('原生条目也应有删除按钮（保持对齐）');
}

/* 已停用的工具：删除线 + aria-pressed=false；副标题按 N/M 计 */
const half = mount(surface.__internals.ServerRow, {
  server: Object.assign({}, server, {
    enabledTools: 7,
    tools: server.tools.map((t, i) => i === 0 ? Object.assign({}, t, { enabled: false }) : Object.assign({}, t, { enabled: true })),
  }),
  canToggle: true, busy: false, busyTool: '', onToggle: () => {}, onTool: () => {},
});
findAll(half.tree(), (n) => n.props.className === 'mq__disclose')[0].props.onClick();
const halfText = textOf(half.tree());
if (!halfText.includes('7/8 个工具已启用')) throw new Error('副标题未按 N/M 计: ' + halfText.slice(0, 200));
const offChip = findAll(half.tree(), (n) => String(n.props.className || '').split(' ').indexOf('mq__chip') >= 0)[0];
if (offChip.props['data-off'] !== '1' || offChip.props['aria-pressed'] !== 'false') throw new Error('停用工具标签状态错误');

/* 工具必须全部显示：不截断、没有 +N */
const big = mount(surface.__internals.ServerRow, {
  server: Object.assign({}, server, { tools: Array.from({ length: 32 }, (_, i) => ({ name: 't' + i, publicName: 'mcp__b__t' + i, description: '' })) }),
  canToggle: true, busy: false, busyTool: '', onToggle: () => {}, onTool: () => {},
});
findAll(big.tree(), (n) => n.props.className === 'mq__disclose')[0].props.onClick();
const bigText = textOf(big.tree());
const bigChips = findAll(big.tree(), (n) => String(n.props.className || '').split(' ').indexOf('mq__chip') >= 0);
if (bigChips.length !== 32) throw new Error('32 个工具必须全部显示, got ' + bigChips.length);
if (bigText.includes('+20')) throw new Error('不应再有 +N 截断');
if (!bigText.includes('t31')) throw new Error('最后一个工具也要显示');

/* 停用态 */
const off = mount(surface.__internals.ServerRow, {
  server: Object.assign({}, server, { enabled: false }), canToggle: true, busy: false, onToggle: () => {},
});
if (!textOf(off.tree()).includes('已停用')) throw new Error('disabled subtitle missing');
const offSw = findAll(off.tree(), (n) => n.props.className === 'mq__switch')[0];
if (offSw.props['aria-checked'] !== 'false') throw new Error('disabled switch state wrong');

/* 不可写时禁用 */
const locked = mount(surface.__internals.ServerRow, { server, canToggle: false, busy: false, onToggle: () => {} });
if (findAll(locked.tree(), (n) => n.props.className === 'mq__switch')[0].props.disabled !== true) throw new Error('canToggle=false 必须禁用');

/* 添加弹窗 */
const submitted = [];
const dlg = mount(surface.__internals.AddDialog, { onClose: () => {}, onSubmit: (c) => submitted.push(c), busy: false });
if (!textOf(dlg.tree()).includes('添加 MCP')) throw new Error('dialog title missing');
const inputs = findAll(dlg.tree(), (n) => n.props.className === 'mq__input');
if (inputs.length < 3) throw new Error('dialog fields missing: ' + inputs.length);
inputs[0].props.onChange({ target: { value: 'gearboy' } });
inputs[1].props.onChange({ target: { value: 'C:/Tools/gearboy.exe' } });
inputs[2].props.onChange({ target: { value: '--mcp-stdio --headless' } });
findAll(dlg.tree(), (n) => n.props.className === 'mq__btn mq__btn--primary')[0].props.onClick();
if (submitted.length !== 1) throw new Error('submit not called');
const cfg = submitted[0];
if (cfg.serverName !== 'gearboy' || cfg.transport !== 'stdio' || cfg.command !== 'C:/Tools/gearboy.exe') throw new Error('submit payload wrong: ' + JSON.stringify(cfg));
if (cfg.args.length !== 2 || cfg.args[0] !== '--mcp-stdio') throw new Error('args parse wrong: ' + JSON.stringify(cfg.args));

/* 头像颜色稳定 */
const c1 = surface.__internals.avatarColor('miora');
const c2 = surface.__internals.avatarColor('miora');
if (c1 !== c2) throw new Error('avatar color unstable');

/* fetch */
sandbox.fetch = () => Promise.reject(new Error('offline'));
const failed = await surface.__internals.fetchReport();
if (!String(failed.error).includes('offline')) throw new Error('fetch rejection not contained');
sandbox.fetch = () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
if (!String((await surface.__internals.fetchReport()).error).includes('500')) throw new Error('HTTP failure not reported');
sandbox.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, restartRequired: true }) });
if ((await surface.__internals.postToggle('a', true)).ok !== true) throw new Error('toggle happy path');
let sent = null;
sandbox.fetch = (url, init) => { sent = { url, body: JSON.parse(init.body) }; return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }); };
await surface.__internals.postTool('miora', 'miora_write_canvas', false);
if (sent.url !== '/dsh-mcp-viewer/tool') throw new Error('wrong tool url: ' + sent.url);
if (sent.body.serverName !== 'miora' || sent.body.tool !== 'miora_write_canvas' || sent.body.enabled !== false) throw new Error('tool payload wrong: ' + JSON.stringify(sent.body));
sandbox.fetch = () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ ok: false, error: '这个改动必须来自 DSH 窗口' }) });
const denied = await surface.__internals.postAdd({ serverName: 'x' });
if (denied.ok !== false || !String(denied.error).includes('DSH 窗口')) throw new Error('auth failure wrong');

/* 配置文件视图 */
let cfgSent = null;
sandbox.fetch = (url, init) => {
  cfgSent = JSON.parse(init.body);
  if (cfgSent.action === 'load') {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, path: 'C:/p/mcp.json', exists: false, text: '{\n  "mcpServers": {}\n}\n' }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, imported: 2, restartRequired: true }) });
};
const cfgGutter = mount(surface.__internals.ConfigView, { onBack: () => {}, onSaved: () => {} });
await new Promise((r) => setTimeout(r, 0));
cfgGutter.render();
const cfgText = textOf(cfgGutter.tree());
if (!cfgText.includes('返回 MCP 列表')) throw new Error('返回按钮缺失');
if (!cfgText.includes('C:/p/mcp.json')) throw new Error('配置文件路径未显示: ' + cfgText.slice(0, 200));
if (!cfgText.includes('mcpServers')) throw new Error('编辑器内容未载入');
if (!cfgText.includes('保存')) throw new Error('保存按钮缺失');

const ta = findAll(cfgGutter.tree(), (n) => n.props.className === 'mq__code')[0];
if (!ta) throw new Error('编辑区缺失');
if (ta.props.spellCheck !== false) throw new Error('编辑区应关闭拼写检查');
ta.props.onChange({ target: { value: '{\n  "mcpServers": { "x": { "command": "y" } }\n}' } });
const saveBtn = findAll(cfgGutter.tree(), (n) => String(n.props.className || '').indexOf('mq__btn--primary') >= 0)[0];
if (!saveBtn) throw new Error('保存按钮未注册');
saveBtn.props.onClick();
await new Promise((r) => setTimeout(r, 0));
if (cfgSent === null || cfgSent.action !== 'save') throw new Error('保存未发出: ' + JSON.stringify(cfgSent));
if (cfgSent.text.indexOf('"x"') < 0) throw new Error('保存内容不对: ' + cfgSent.text);

/* 行号列与内容行数一致 */
const gutter = findAll(cfgGutter.tree(), (n) => n.props.className === 'mq__gutter')[0];
if (!gutter) throw new Error('行号列缺失');
const numCount = findAll(gutter, (n) => typeof n.children?.[0] === 'number' || /^\d+$/.test(textOf(n))).length;
if (numCount < 2) throw new Error('行号太少: ' + numCount);
/* 整页渲染：McpViewerPage 必须不抛错（白屏回归） */
sandbox.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({
  version: 6, servers: [{ id: 'x', serverName: 'x', enabled: true, added: true, tools: [] }],
  counts: { servers: 1, enabled: 1 }, canToggle: true, orphans: [], prefs: { sidebarPanel: false },
}) });
const page = mount(surface.__internals.McpViewerPage, {});
await new Promise((r) => setTimeout(r, 0));
const pageText = textOf(page.tree());
if (!pageText.includes('MCP')) throw new Error('整页渲染缺少 MCP 文案');
if (findAll(page.tree(), (n) => n.props.className === 'mq__reconn').length === 0) {
  throw new Error('整页应渲染重连按钮');
}
console.log('OK 中文界面 / 一层折叠 / 工具标签 / 开关 / 删除按钮 / 添加弹窗 / 配置文件 / 无二级折叠');
