import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
/* Host 半边离线测试：真文件系统、假 loader / tools / webServer。 */
const here = dirname(fileURLToPath(import.meta.url));
const fake = join(here, '.tmp-profile');
const patchFile = join(fake, 'cordis.patch.yml');
rmSync(fake, { recursive: true, force: true });
mkdirSync(join(fake, 'node_modules', 'dsh-mcp-viewer', 'lib'), { recursive: true });
writeFileSync(patchFile, '# profile patch\n- id: something\n  name: x\n', 'utf8');
writeFileSync(join(fake, 'node_modules', 'dsh-mcp-viewer', 'lib', 'index.js'),
  readFileSync(join(here, '..', 'lib', 'index.js'), 'utf8'), 'utf8');
const mod = await import('file://' + join(fake, 'node_modules', 'dsh-mcp-viewer', 'lib', 'index.js'));
const reconnects = [];
const rows = [
  { options: { id: 'windows-mcp-bridge', name: '@deepseek-ai/dsh-mcp-client',
      config: { serverName: 'windows', transport: 'stdio', command: 'uvx', args: ['windows-mcp'] } }, disabled: false,
    update: async function (o, c, f) { reconnects.push({ id: this.options.id, force: f }); } },
  { options: { id: 'mcp-miora', name: '@deepseek-ai/dsh-mcp-client',
      config: { serverName: 'miora', transport: 'streamable-http', url: 'http://127.0.0.1:7777/mcp' } }, disabled: true },
  { options: { id: 'dsh-ops', name: 'dsh-ops', config: {} }, disabled: false },
];
const schemas = [
  { name: 'mcp__windows__Screenshot' },
  { name: 'mcp__windows__Boom' },
  { name: 'mcp__miora__write_canvas' },
  { name: 'mcp__ghost__ping' },
];
const routes = [];
/* 记录 restrict/guard，验证工具闸门真的挂上了 */
const restricts = [];
const guards = [];
const services = {
  loader: { entries: () => rows },
  tools: {
    schemas: () => schemas,
    restrict: (filter) => { restricts.push(filter); return () => {}; },
    guard: (fn) => { guards.push(fn); return () => {}; },
  },
  webServer: { register: (r) => routes.push(r) },
};
const events = {};
const ctx = {
  webServer: services.webServer,
  tools: services.tools,
  get: (n) => services[n],
  on: (name, fn) => { (events[name] = events[name] || []).push(fn); },
  inject: (names, cb) => { if (names.every((n) => services[n] !== undefined)) cb(ctx); },
  logger: { warn: () => {} },
};
mod.apply(ctx);
const byPath = (p) => routes.find((r) => r.path === p);
if (routes.length !== 8) throw new Error('expected 8 routes, got ' + routes.length + ': ' + routes.map((r) => r.path));
const reconnect = byPath('/dsh-mcp-viewer/reconnect');
if (!reconnect) throw new Error('missing /reconnect route');
const config = byPath('/dsh-mcp-viewer/config');
const prefsRoute = byPath('/dsh-mcp-viewer/prefs');
if (!prefsRoute) throw new Error('missing /prefs route');
if (!config) throw new Error('missing /config route');
const tool = byPath('/dsh-mcp-viewer/tool');
if (!tool) throw new Error('missing /tool route');
if (guards.length !== 1) throw new Error('闸门没挂上: ' + guards.length);
const status = byPath('/dsh-mcp-viewer/api');
const toggle = byPath('/dsh-mcp-viewer/toggle');
const add = byPath('/dsh-mcp-viewer/add');
const remove = byPath('/dsh-mcp-viewer/remove');
if (!status || !toggle || !add || !remove) throw new Error('missing route');
const H = { host: '127.0.0.1:57609', origin: 'http://127.0.0.1:57609' };
function call(route, method, headers, body) {
  return new Promise((resolve) => {
    const ls = {};
    let code = 0, text = '';
    const req = { method, headers, on(e, f) { ls[e] = f; return req; } };
    const res = { writeHead(c) { code = c; }, end(p) { text = p; resolve({ code, body: JSON.parse(p) }); } };
    route.handler(req, res);
    if (body !== undefined) { ls.data(Buffer.from(JSON.stringify(body))); ls.end(); }
  });
}
/* 1. 读 */
const read = await call(status, 'GET', H);
if (read.code !== 200) throw new Error('GET failed');
const report = read.body;
if (report.servers.length !== 2) throw new Error('servers: ' + report.servers.length);
const windows = report.servers.find((s) => s.serverName === 'windows');
const miora = report.servers.find((s) => s.serverName === 'miora');
if (!windows || !miora) throw new Error('server names wrong');
if (windows.tools.length !== 2 || miora.tools.length !== 1) throw new Error('tool grouping wrong: ' + windows.tools.length + '/' + miora.tools.length);
if (miora.enabled !== false) throw new Error('miora should start disabled');
if (report.orphans.length !== 1) throw new Error('orphan detection wrong');
if (report.canToggle !== true) throw new Error('canToggle wrong');
/* 1b. 工具级开关：立即生效、写状态、guard 拦住派发 */
const offTool = await call(tool, 'POST', H, { serverName: 'windows', tool: 'Screenshot', enabled: false });
if (offTool.code !== 200 || offTool.body.ok !== true) throw new Error('tool toggle failed: ' + JSON.stringify(offTool.body));
if (offTool.body.restartRequired !== false) throw new Error('工具开关不应要求重启');
const stateAfter = JSON.parse(readFileSync(join(fake, '.dsh-mcp-viewer.state.json'), 'utf8'));
if (!Array.isArray(stateAfter.tools.windows) || stateAfter.tools.windows.indexOf('Screenshot') < 0) {
  throw new Error('工具状态没写进 state: ' + JSON.stringify(stateAfter.tools));
}
const blocked = guards[0]({ name: 'mcp__windows__Screenshot' });
if (typeof blocked !== 'string') throw new Error('guard 应拦住已停用的工具');
if (guards[0]({ name: 'mcp__miora__write_canvas' }) !== undefined) throw new Error('guard 不应拦住启用的工具');
if (guards[0]({ name: 'run_code' }) !== undefined) throw new Error('guard 不应碰非 MCP 工具');
const readTool = await call(status, 'GET', H);
const winTools = readTool.body.servers.find((s) => s.serverName === 'windows');
const shot = winTools.tools.find((t) => t.name === 'Screenshot');
if (!shot || shot.enabled !== false) throw new Error('报告未反映工具停用');
if (winTools.tools.find((t) => t.name === 'Boom').enabled !== true) throw new Error('不该波及别的工具');
if (winTools.enabledTools !== 1) throw new Error('enabledTools 计数错误: ' + winTools.enabledTools);
const backOn = await call(tool, 'POST', H, { serverName: 'windows', tool: 'Screenshot', enabled: true });
if (backOn.code !== 200) throw new Error('reenable failed');
if (guards[0]({ name: 'mcp__windows__Screenshot' }) !== undefined) throw new Error('重新启用后 guard 仍在拦');
const unknownTool = await call(tool, 'POST', H, { serverName: 'windows', tool: 'Nope', enabled: false });
if (unknownTool.code !== 404) throw new Error('未知工具应 404, got ' + unknownTool.code);
const missingTool = await call(tool, 'POST', H, { serverName: 'windows', enabled: false });
if (missingTool.code !== 400) throw new Error('缺参数应 400');
/* 2. 开关 */
const t1 = await call(toggle, 'POST', H, { id: 'mcp-miora', enabled: true });
if (t1.code !== 200 || t1.body.ok !== true) throw new Error('toggle failed: ' + JSON.stringify(t1.body));
const patch1 = readFileSync(patchFile, 'utf8');
if (!patch1.includes('# >>> dsh-mcp-viewer: managed >>>')) throw new Error('marker missing');
if (!/mcp-miora[\s\S]*?disabled: false/.test(patch1)) throw new Error('override not written:\n' + patch1);
if (!patch1.includes('- id: something')) throw new Error('原有内容被破坏');
/* 3. 新增 */
const a1 = await call(add, 'POST', H, { serverName: 'gearboy', transport: 'stdio', command: 'C:/Tools/gearboy.exe', args: ['--mcp-stdio'] });
if (a1.code !== 200 || a1.body.ok !== true) throw new Error('add failed: ' + JSON.stringify(a1.body));
if (a1.body.id !== 'mcp-gearboy') throw new Error('generated id wrong: ' + a1.body.id);
const patch2 = readFileSync(patchFile, 'utf8');
if (!patch2.includes('- insert:')) throw new Error('insert list missing');
if (!/- insert:[\s\S]*?id: mcp-gearboy[\s\S]*?name: '@deepseek-ai\/dsh-mcp-client'/.test(patch2)) throw new Error('inserted row wrong:\n' + patch2);
if (!patch2.includes("command: 'C:/Tools/gearboy.exe'")) throw new Error('command not quoted correctly');
if (!patch2.includes("args: ['--mcp-stdio']")) throw new Error('args not written');
/* 4. 再读：新增条目即便 loader 里还看不到，也要列出来 */
const read2 = await call(status, 'GET', H);
const gearboy = read2.body.servers.find((s) => s.serverName === 'gearboy');
if (!gearboy) throw new Error('new server not listed');
if (gearboy.added !== true) throw new Error('added flag missing');
if (gearboy.target !== 'C:/Tools/gearboy.exe --mcp-stdio') throw new Error('target wrong: ' + gearboy.target);
if (read2.body.counts.servers !== 3) throw new Error('server count wrong: ' + read2.body.counts.servers);
/* 5. 重名拒绝 */
const dup = await call(add, 'POST', H, { serverName: 'gearboy', transport: 'stdio', command: 'x' });
if (dup.code !== 409) throw new Error('duplicate should be 409, got ' + dup.code);
/* 6. 参数校验 */
const badName = await call(add, 'POST', H, { serverName: 'a b', transport: 'stdio', command: 'x' });
if (badName.code !== 400) throw new Error('bad name should be 400');
const noCmd = await call(add, 'POST', H, { serverName: 'ok', transport: 'stdio' });
if (noCmd.code !== 400) throw new Error('missing command should be 400');
const badUrl = await call(add, 'POST', H, { serverName: 'ok2', transport: 'streamable-http', url: 'ftp://x' });
if (badUrl.code !== 400) throw new Error('bad url should be 400');
/* 7. 移除：本插件新增的直接删；原生条目写成 disabled 禁用（对齐显示删除按钮） */
const nativeDel = await call(remove, 'POST', H, { id: 'windows-mcp-bridge' });
if (nativeDel.code !== 200) throw new Error('native row remove should be 200, got ' + nativeDel.code);
const patchNative = readFileSync(patchFile, 'utf8');
if (!/- id: windows-mcp-bridge[\s\S]{0,40}disabled: true/.test(patchNative)) throw new Error('native row should be disabled in patch');
const removed = await call(remove, 'POST', H, { id: 'mcp-gearboy' });
if (removed.code !== 200) throw new Error('remove failed');
const patch3 = readFileSync(patchFile, 'utf8');
if (patch3.includes('mcp-gearboy')) throw new Error('removed entry still in patch');
if (!patch3.includes('mcp-miora')) throw new Error('override lost after remove');
/* 7b. 重连：强制重启 loader 条目 */
const reconn = await call(reconnect, 'POST', H, { id: 'windows-mcp-bridge' });
if (reconn.code !== 200) throw new Error('reconnect should be 200, got ' + reconn.code);
if (reconn.body.restartRequired !== false) throw new Error('reconnect should not need full restart');
if (reconnects.length !== 1 || reconnects[0].id !== 'windows-mcp-bridge' || reconnects[0].force !== true) {
  throw new Error('reconnect did not force-restart the entry: ' + JSON.stringify(reconnects));
}
const reconnBad = await call(reconnect, 'POST', H, { id: 'no-such' });
if (reconnBad.code !== 404) throw new Error('reconnect unknown should be 404');
/* 8. 安全栅栏 + 方法 */
const cross = await call(toggle, 'POST', { host: '127.0.0.1:57609', origin: 'http://evil.test' }, { id: 'mcp-miora', enabled: false });
if (cross.code !== 403) throw new Error('cross origin should be 403');
const foreignHost = await call(toggle, 'POST', { host: '10.0.0.5:80' }, { id: 'mcp-miora', enabled: false });
if (foreignHost.code !== 403) throw new Error('non-loopback host should be 403');
const wrongMethod = await call(status, 'POST', H, {});
if (wrongMethod.code !== 405) throw new Error('POST status should be 405');
const getToggle = await call(toggle, 'GET', H);
if (getToggle.code !== 405) throw new Error('GET toggle should be 405');
/* 8b. 配置文件：读默认骨架 → 保存 → 条目进列表 */
const cfgLoad = await call(config, 'POST', H, { action: 'load' });
if (cfgLoad.code !== 200 || cfgLoad.body.ok !== true) throw new Error('config load failed');
if (cfgLoad.body.exists !== false) throw new Error('should start with no file');
if (!cfgLoad.body.text.includes('mcpServers')) throw new Error('skeleton missing');
if (!cfgLoad.body.path.endsWith('mcp.json')) throw new Error('path wrong: ' + cfgLoad.body.path);
const badJson = await call(config, 'POST', H, { action: 'save', text: '{ not json' });
if (badJson.code !== 400) throw new Error('bad JSON should be 400, got ' + badJson.code);
const noCommand = await call(config, 'POST', H, { action: 'save', text: JSON.stringify({ mcpServers: { a: {} } }) });
if (noCommand.code !== 400) throw new Error('missing command should be 400');
const badCfgName = await call(config, 'POST', H, { action: 'save', text: JSON.stringify({ mcpServers: { 'a b': { command: 'x' } } }) });
if (badCfgName.code !== 400) throw new Error('bad name should be 400');
const payload = { mcpServers: {
  gearboy: { command: 'C:/Tools/gearboy.exe', args: ['--mcp-stdio'], env: { A: '1' } },
  miro: { url: 'http://127.0.0.1:7777/mcp', headers: { 'X-Key': 'k' } },
} };
const saved = await call(config, 'POST', H, { action: 'save', text: JSON.stringify(payload, null, 2) });
if (saved.code !== 200 || saved.body.imported !== 2) throw new Error('config save failed: ' + JSON.stringify(saved.body));
if (saved.body.restartRequired !== true) throw new Error('config save must ask for restart');
const cfgFile = readFileSync(join(fake, 'mcp.json'), 'utf8');
if (!cfgFile.includes('mcpServers')) throw new Error('config file not written');
const patchAfterCfg = readFileSync(patchFile, 'utf8');
if (!/id: mcp-gearboy/.test(patchAfterCfg)) throw new Error('gearboy not mounted');
if (!/id: mcp-miro/.test(patchAfterCfg)) throw new Error('miro not mounted');
if (!/env:[\s\S]*?A: '1'/.test(patchAfterCfg)) throw new Error('env not rendered:\n' + patchAfterCfg);
if (!/headers:[\s\S]*?X-Key: 'k'/.test(patchAfterCfg)) throw new Error('headers not rendered:\n' + patchAfterCfg);
const afterCfg = await call(status, 'GET', H);
const names = afterCfg.body.servers.map((s) => s.serverName).sort();
if (names.indexOf('gearboy') < 0 || names.indexOf('miro') < 0) throw new Error('config servers not listed: ' + names);
/* 从文件里删掉一个：托管块也要跟着消失 */
await call(config, 'POST', H, { action: 'save', text: JSON.stringify({ mcpServers: { gearboy: { command: 'C:/Tools/gearboy.exe' } } }) });
const patchShrunk = readFileSync(patchFile, 'utf8');
if (/mcp-miro/.test(patchShrunk)) throw new Error('removed config entry still mounted');
/* 8d. 侧边栏偏好：默认关 → 打开 → 报告读到 → 关掉 */
const prefsRead = await call(status, 'GET', H);
if (prefsRead.body.prefs.sidebarPanel !== false) throw new Error('默认必须关闭');
const badPrefs = await call(prefsRoute, 'POST', H, { sidebarPanel: 'yes' });
if (badPrefs.code !== 400) throw new Error('非布尔值应 400');
const prefOn = await call(prefsRoute, 'POST', H, { sidebarPanel: true });
if (prefOn.code !== 200 || prefOn.body.ok !== true) throw new Error('保存偏好失败');
const prefState = JSON.parse(readFileSync(join(fake, '.dsh-mcp-viewer.state.json'), 'utf8'));
if (prefState.prefs.sidebarPanel !== true) throw new Error('偏好没写进 state');
if ((await call(status, 'GET', H)).body.prefs.sidebarPanel !== true) throw new Error('报告没读到偏好');
await call(prefsRoute, 'POST', H, { sidebarPanel: false });
if ((await call(status, 'GET', H)).body.prefs.sidebarPanel !== false) throw new Error('关不掉');

/* 9. 空组合 */
const bareRoutes = [];
mod.apply({ get: () => undefined, inject: (n, cb) => cb({ webServer: { register: (r) => bareRoutes.push(r) } }), logger: { warn: () => {} } });
const bareRead = await call(bareRoutes.find((r) => r.path === '/dsh-mcp-viewer/api'), 'GET', H);
if (bareRead.code !== 200 || bareRead.body.loaderAvailable !== false) throw new Error('bare composition failed');
rmSync(fake, { recursive: true, force: true });
console.log('OK 读 / 开关 / 新增 / 重名 409 / 参数 400 / 只删自己的 / 强制重连 / 403 / 405 / 空组合');
