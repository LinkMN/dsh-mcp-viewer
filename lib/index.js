/**
 * dsh-mcp-viewer — 宿主半边。
 *
 *   GET  /dsh-mcp-viewer/api     服务器、工具、开关状态
 *   POST /dsh-mcp-viewer/toggle  整台 MCP server 停用/启用（写 patch，重启生效）
 *   POST /dsh-mcp-viewer/tool    单个工具停用/启用（立即生效，也持久化）
 *   POST /dsh-mcp-viewer/add     新增一个 MCP server
 *   POST /dsh-mcp-viewer/remove  移除本插件新增的那一个
 *
 * 两类开关的作用方式不同，这是刻意的：
 *   - server 级改的是 loader 条目，只有重启才生效；
 *   - tool 级走的是 dispatching 期的 gate：`restrict()` 让 schema 不进模型工具表，
 *     `guard()` 在派发口同步否决 —— 模型靠着历史记住名字也调不动。
 *   两者都写进 profile 的 .dsh-mcp-viewer.state.json，重启后重新应用。
 *
 * 三条纪律：apply() 绝不抛；只注入一定存在的服务；写操作要有来源证明。
 * 零运行时依赖：只用 node:* 内建模块。
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'mcp-viewer';
export const inject = [];

const BRIDGE_PLUGIN = '@deepseek-ai/dsh-mcp-client';
const TOOL_PREFIX = 'mcp__';
const ROUTE_STATUS = '/dsh-mcp-viewer/api';
const ROUTE_TOGGLE = '/dsh-mcp-viewer/toggle';
const ROUTE_TOOL = '/dsh-mcp-viewer/tool';
const ROUTE_CONFIG = '/dsh-mcp-viewer/config';
const ROUTE_PREFS = '/dsh-mcp-viewer/prefs';
const ROUTE_ADD = '/dsh-mcp-viewer/add';
const ROUTE_REMOVE = '/dsh-mcp-viewer/remove';
const ROUTE_RECONNECT = '/dsh-mcp-viewer/reconnect';

const MARK_START = '# >>> dsh-mcp-viewer: managed >>>';
const MARK_END = '# <<< dsh-mcp-viewer: managed <<<';

/** <profile>/node_modules/dsh-mcp-viewer/lib/ 往上三级就是 profile 根。 */
const profileRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const patchPath = join(profileRoot, 'cordis.patch.yml');
const statePath = join(profileRoot, '.dsh-mcp-viewer.state.json');
/** JSON 配置文件的默认位置：和 profile 放一起，而不是塞进某个隐藏目录。 */
const configPath = join(profileRoot, 'mcp.json');

function safe(read, fallback) {
  try {
    const value = read();
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

/* ───────────────────────── 状态 ───────────────────────── */

function emptyState() {
  return { version: 3, overrides: {}, added: [], tools: {}, prefs: { sidebarPanel: false } };
}

/** 一次 stat 就能判断文件有没有变，gate 每次派发都会读一遍。 */
let cache = { key: '', state: null };

function stateKey() {
  const st = safe(() => statSync(statePath), null);
  if (st === null) return 'missing';
  return String(st.size) + ':' + String(st.mtimeMs);
}

function readState() {
  const key = stateKey();
  if (cache.state !== null && cache.key === key) return cache.state;
  const state = emptyState();
  if (key !== 'missing') {
    const text = safe(() => readFileSync(statePath, 'utf8'), '');
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (parsed !== null && typeof parsed === 'object') {
      const overrides = parsed.overrides;
      if (overrides !== null && typeof overrides === 'object') {
        for (const id of Object.keys(overrides)) {
          if (typeof overrides[id] === 'boolean') state.overrides[id] = overrides[id];
        }
      }
      const added = parsed.added;
      if (Array.isArray(added)) {
        for (const item of added) {
          if (item === null || typeof item !== 'object') continue;
          if (typeof item.id !== 'string' || typeof item.serverName !== 'string') continue;
          const env = {};
          const rawEnv = item.env;
          if (rawEnv !== null && typeof rawEnv === 'object' && !Array.isArray(rawEnv)) {
            for (const key of Object.keys(rawEnv)) if (typeof rawEnv[key] === 'string') env[key] = rawEnv[key];
          }
          const headers = {};
          const rawHeaders = item.headers;
          if (rawHeaders !== null && typeof rawHeaders === 'object' && !Array.isArray(rawHeaders)) {
            for (const key of Object.keys(rawHeaders)) if (typeof rawHeaders[key] === 'string') headers[key] = rawHeaders[key];
          }
          state.added.push({
            id: item.id,
            serverName: item.serverName,
            transport: item.transport === 'streamable-http' ? 'streamable-http' : 'stdio',
            source: item.source === 'config' ? 'config' : 'dialog',
            command: typeof item.command === 'string' ? item.command : '',
            url: typeof item.url === 'string' ? item.url : '',
            args: Array.isArray(item.args) ? item.args.filter((a) => typeof a === 'string') : [],
            env: env,
            headers: headers,
          });
        }
      }
      const prefs = parsed.prefs;
      if (prefs !== null && typeof prefs === "object" && typeof prefs.sidebarPanel === "boolean") {
        state.prefs.sidebarPanel = prefs.sidebarPanel;
      }
      const tools = parsed.tools;
      if (tools !== null && typeof tools === 'object') {
        for (const serverName of Object.keys(tools)) {
          const list = tools[serverName];
          if (!Array.isArray(list)) continue;
          const kept = list.filter((name) => typeof name === 'string' && name !== '');
          if (kept.length > 0) state.tools[serverName] = kept;
        }
      }
    }
  }
  cache = { key: key, state: state };
  return state;
}

function saveState(state) {
  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
    cache = { key: stateKey(), state: state };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: '写状态文件失败：' + String(error) };
  }
}

function q(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function renderBlock(state) {
  const lines = [MARK_START, '# 本段由 dsh-mcp-viewer 维护。删掉整段并重启，即回到没有本插件改动的状态。'];
  if (state.added.length > 0) {
    lines.push('- insert:');
    for (const item of state.added) {
      lines.push('    - id: ' + item.id);
      lines.push('      name: ' + q(BRIDGE_PLUGIN));
      lines.push('      config:');
      lines.push('        serverName: ' + item.serverName);
      lines.push('        transport: ' + item.transport);
      if (item.transport === 'streamable-http') {
        lines.push('        url: ' + q(item.url));
        const headerKeys = Object.keys(item.headers ?? {}).sort();
        if (headerKeys.length > 0) {
          lines.push('        headers:');
          for (const key of headerKeys) lines.push('          ' + key + ': ' + q(item.headers[key]));
        }
      } else {
        lines.push('        command: ' + q(item.command));
        if (item.args.length > 0) {
          lines.push('        args: [' + item.args.map((a) => q(a)).join(', ') + ']');
        }
        const envKeys = Object.keys(item.env ?? {}).sort();
        if (envKeys.length > 0) {
          lines.push('        env:');
          for (const key of envKeys) lines.push('          ' + key + ': ' + q(item.env[key]));
        }
      }
    }
  }
  const ids = Object.keys(state.overrides).sort();
  for (const id of ids) {
    lines.push('- id: ' + id);
    lines.push('  disabled: ' + (state.overrides[id] === true ? 'false' : 'true'));
  }
  lines.push(MARK_END);
  return lines;
}

function writePatch(state) {
  if (!safe(() => existsSync(patchPath), false)) return { ok: false, error: '找不到本 profile 的 cordis.patch.yml' };
  const text = safe(() => readFileSync(patchPath, 'utf8'), null);
  if (typeof text !== 'string') return { ok: false, error: '无法读取 cordis.patch.yml' };
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const block = renderBlock(state).join(eol);
  const start = text.indexOf(MARK_START);
  let next;
  if (start < 0) {
    const base = text.endsWith(eol) ? text : text + eol;
    next = base + eol + block + eol;
  } else {
    const end = text.indexOf(MARK_END, start);
    const tail = end < 0 ? '' : text.slice(end + MARK_END.length);
    next = text.slice(0, start) + block + tail;
  }
  try {
    writeFileSync(patchPath, next, 'utf8');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/* ───────────────────────── 读取 ───────────────────────── */

function identityOf(toolName) {
  if (typeof toolName !== 'string' || !toolName.startsWith(TOOL_PREFIX)) return null;
  const rest = toolName.slice(TOOL_PREFIX.length);
  const cut = rest.indexOf('__');
  if (cut <= 0) return null;
  return { server: rest.slice(0, cut), raw: rest.slice(cut + 2) };
}

/** 这个 (server, raw) 现在是不是被关掉了。 */
function toolOff(state, serverName, raw) {
  const list = state.tools[serverName];
  if (!Array.isArray(list)) return false;
  return list.indexOf(raw) >= 0;
}

function rowOf(entry) {
  const options = entry && typeof entry === 'object' && entry.options ? entry.options : entry;
  return {
    id: options && typeof options.id === 'string' ? options.id : null,
    name: options && typeof options.name === 'string' ? options.name : null,
    disabled: Boolean(entry && typeof entry === 'object' && entry.disabled === true),
    config: options && typeof options.config === 'object' && options.config !== null ? options.config : {},
  };
}

function loaderRows(ctx) {
  const loader = safe(() => ctx.get('loader'), undefined);
  if (loader === null || typeof loader !== 'object' || typeof loader.entries !== 'function') return null;
  const rows = safe(() => Array.from(loader.entries()), null);
  if (!Array.isArray(rows)) return null;
  return rows.map(rowOf);
}

function targetOf(config) {
  const transport = typeof config.transport === 'string' ? config.transport : 'stdio';
  if (transport !== 'stdio') return typeof config.url === 'string' ? config.url : '';
  const parts = [];
  if (typeof config.command === 'string') parts.push(config.command);
  if (Array.isArray(config.args)) {
    for (const arg of config.args) if (typeof arg === 'string') parts.push(arg);
  }
  return parts.join(' ');
}

function configuredServers(rows) {
  const servers = [];
  for (const row of rows ?? []) {
    if (row.name !== BRIDGE_PLUGIN) continue;
    const config = row.config;
    servers.push({
      id: row.id,
      serverName: typeof config.serverName === 'string' ? config.serverName : String(row.id ?? 'mcp'),
      liveEnabled: row.disabled !== true,
      transport: typeof config.transport === 'string' ? config.transport : 'stdio',
      target: safe(() => targetOf(config), ''),
      tools: [],
    });
  }
  return servers;
}

function liveTools(ctx) {
  const registry = safe(() => ctx.get('tools'), undefined);
  if (registry === null || typeof registry !== 'object' || typeof registry.schemas !== 'function') return null;
  const schemas = safe(() => registry.schemas(), null);
  if (!Array.isArray(schemas)) return null;
  const tools = [];
  for (const schema of schemas) {
    if (schema === null || typeof schema !== 'object') continue;
    tools.push({
      name: typeof schema.name === 'string' ? schema.name : '',
      description: typeof schema.description === 'string' ? schema.description : '',
    });
  }
  return tools;
}

/* ───────────────────────── 报告 ───────────────────────── */

function buildReport(ctx) {
  const rows = loaderRows(ctx);
  const state = readState();
  const servers = configuredServers(rows);
  const tools = liveTools(ctx);
  const grouped = new Map();
  for (const tool of tools ?? []) {
    const identity = identityOf(tool.name);
    if (identity === null) continue;
    const record = { name: identity.raw, publicName: tool.name, description: tool.description };
    const bucket = grouped.get(identity.server);
    if (bucket === undefined) grouped.set(identity.server, [record]);
    else bucket.push(record);
  }
  const byId = new Map();
  for (const server of servers) byId.set(server.id, server);

  for (const item of state.added) {
    if (byId.has(item.id)) continue;
    const server = {
      id: item.id,
      serverName: item.serverName,
      liveEnabled: true,
      transport: item.transport,
      target: item.transport === 'streamable-http'
        ? item.url
        : [item.command].concat(item.args).join(' ').trim(),
      tools: [],
    };
    servers.push(server);
    byId.set(server.id, server);
  }

  const claimed = new Set();
  let toolCount = 0;
  let enabledToolCount = 0;
  for (const server of servers) {
    claimed.add(server.serverName);
    server.tools = grouped.get(server.serverName) ?? [];
    let on = 0;
    for (const tool of server.tools) {
      tool.enabled = !toolOff(state, server.serverName, tool.name);
      if (tool.enabled) on += 1;
    }
    server.enabledTools = on;
    server.totalTools = server.tools.length;
    toolCount += server.tools.length;
    enabledToolCount += on;
    const overlay = state.overrides[server.id];
    server.enabled = overlay === undefined ? server.liveEnabled : overlay;
    server.pendingRestart = overlay !== undefined && overlay !== server.liveEnabled;
    server.added = state.added.some((item) => item.id === server.id);
  }

  const orphans = [];
  for (const [serverName, list] of grouped) {
    if (claimed.has(serverName)) continue;
    orphans.push({ serverName: serverName, tools: list });
    toolCount += list.length;
    enabledToolCount += list.length;
  }

  return {
    version: 6,
    loaderAvailable: rows !== null,
    registryAvailable: tools !== null,
    canToggle: safe(() => existsSync(patchPath), false),
    configPath: configPath,
    prefs: { sidebarPanel: state.prefs.sidebarPanel === true },
    servers: servers,
    orphans: orphans,
    counts: {
      servers: servers.length,
      tools: toolCount,
      enabledTools: enabledToolCount,
      enabled: servers.filter((s) => s.enabled === true).length,
    },
  };
}

/* ───────────────────────── 工具闸门 ───────────────────────── */

/**
 * 工具级开关的执行侧。两套机制互补：
 *   1. `restrict({ deny })` 按 agent 作用域把那几个 schema 从模型工具表里摘掉；
 *   2. `guard()` 在派发口同步否决 —— 模型就算记着名字也调不动。
 *
 * `agent/pre-step` 是 waterfall，必须把 next() 交回去，否则会掐掉宿主自己的
 * 决策链并把整轮对话打挂。
 */
function registerToolGate(ctx, warn) {
  const applied = new Map();
  let toolsService = null;
  let applying = false;
  let reapply = null;

  function serviceOf() {
    if (toolsService !== null) return toolsService;
    try {
      return (typeof ctx?.get === 'function' ? ctx.get('tools') : undefined) ?? ctx?.tools ?? null;
    } catch {
      return null;
    }
  }

  /** 此刻必须从模型工具表里摘掉的工具名。 */
  function denyNow() {
    const known = safe(() => serviceOf()?.schemas?.(), null);
    if (!Array.isArray(known)) return null;
    const state = readState();
    const deny = [];
    for (const schema of known) {
      const toolName = schema?.name;
      if (typeof toolName !== 'string') continue;
      const identity = identityOf(toolName);
      if (identity === null) continue;
      if (toolOff(state, identity.server, identity.raw)) deny.push(toolName);
    }
    return deny;
  }

  function release(agent) {
    const previous = applied.get(agent);
    if (previous === undefined) return;
    applied.delete(agent);
    try {
      previous.dispose();
    } catch {
      /* agent 作用域可能已经销毁 */
    }
  }

  function applyToAgent(agent) {
    if (applying) return;
    if (agent === null || typeof agent !== 'object') return;
    applying = true;
    try {
      const scoped = safe(() => agent?.ctx?.get?.('tools') ?? agent?.ctx?.tools, null);
      if (scoped === null || typeof scoped.restrict !== 'function') return;
      const deny = denyNow();
      if (deny === null) return;
      const key = deny.slice().sort().join(',');
      const previous = applied.get(agent);
      if (previous !== undefined && previous.key === key) return;
      release(agent);
      if (deny.length === 0) return;
      try {
        applied.set(agent, { key: key, dispose: scoped.restrict({ deny: deny }) });
      } catch (error) {
        warn('无法收紧工具表：' + String(error));
      }
    } finally {
      applying = false;
    }
  }

  reapply = (agent) => {
    if (agent !== undefined && agent !== null) {
      applyToAgent(agent);
      return;
    }
    for (const known of Array.from(applied.keys())) applyToAgent(known);
  };

  if (typeof ctx?.on === 'function') {
    const hook = (event, handler) => {
      try {
        ctx.on(event, handler);
      } catch (error) {
        warn('挂 ' + event + ' 失败：' + String(error));
      }
    };
    hook('agent/created', (payload) => applyToAgent(payload?.agent));
    hook('agent/disposed', (payload) => release(payload?.agent));
    hook('agent/pre-step', async (payload, next) => {
      try {
        applyToAgent(payload?.agent);
      } catch {
        /* 闸门失败绝不能拖垮这一轮 */
      }
      return typeof next === 'function' ? next() : undefined;
    });
    hook('tools/change', () => reapply());
  }

  if (typeof ctx?.inject !== 'function') return { reapply: reapply };
  try {
    ctx.inject(['tools'], (scoped) => {
      try {
        if (scoped?.tools) toolsService = scoped.tools;
        if (typeof scoped?.tools?.guard !== 'function') return;
        scoped.tools.guard((execution) => {
          const toolName = execution?.name;
          const identity = identityOf(toolName);
          if (identity === null) return undefined;
          if (!toolOff(readState(), identity.server, identity.raw)) return undefined;
          return '"' + toolName + '" 已在 MCP 面板里停用。到 设置 → MCP 服务 展开该服务器，点一下这个工具即可重新启用。';
        });
      } catch (error) {
        warn('装不上工具闸门：' + String(error));
      }
    });
  } catch (error) {
    warn('注入 tools 服务失败：' + String(error));
  }
  return { reapply: reapply };
}

/* ───────────────────────── 配置文件（mcp.json） ───────────────────────── */

/**
 * 读 mcp.json。缺失时给一份空骨架 —— 面板要能让人看到“从零开始写”的样子，
 * 而不是一个空白错误页。
 */
function readConfig() {
  const exists = safe(() => existsSync(configPath), false);
  if (!exists) return { path: configPath, exists: false, text: JSON.stringify({ mcpServers: {} }, null, 2) + '\n' };
  const text = safe(() => readFileSync(configPath, 'utf8'), null);
  if (typeof text !== 'string') return { path: configPath, exists: true, text: '', error: '读不到文件内容' };
  return { path: configPath, exists: true, text: text };
}

/**
 * 把一份 mcpServers JSON 解析成我们自己的 added 描述。
 * 认得两种常见形状：
 *   { command, args[], env{} }                      → stdio
 *   { url, headers{} } 或 { type: 'http', url }     → streamable-http
 * 名字取 key；未知字段忽略，不报错。
 */
function parseServersJson(raw) {
  let document;
  try {
    document = JSON.parse(raw);
  } catch (error) {
    return { ok: false, error: 'JSON 解析失败：' + String(error.message ?? error) };
  }
  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    return { ok: false, error: '顶层必须是一个对象' };
  }
  const table = document.mcpServers ?? document.servers ?? document;
  if (table === null || typeof table !== 'object' || Array.isArray(table)) {
    return { ok: false, error: 'mcpServers 必须是一个对象' };
  }
  const servers = [];
  for (const key of Object.keys(table)) {
    const entry = table[key];
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      return { ok: false, error: key + '：必须是一个对象' };
    }
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(key)) {
      return { ok: false, error: key + '：名称只能用字母、数字、下划线和短横线，1-32 个字符' };
    }
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    const command = typeof entry.command === 'string' ? entry.command.trim() : '';
    const explicitHttp = entry.type === 'http' || entry.type === 'streamable-http' || entry.transport === 'streamable-http';
    const transport = url !== '' && (explicitHttp || command === '') ? 'streamable-http' : 'stdio';
    if (transport === 'stdio' && command === '') {
      return { ok: false, error: key + '：stdio 条目需要 command' };
    }
    if (transport === 'streamable-http' && !/^https?:\/\//.test(url)) {
      return { ok: false, error: key + '：HTTP 条目需要以 http:// 或 https:// 开头的 url' };
    }
    const args = Array.isArray(entry.args) ? entry.args.filter((a) => typeof a === 'string' && a !== '') : [];
    const env = {};
    if (entry.env !== null && typeof entry.env === 'object' && !Array.isArray(entry.env)) {
      for (const name of Object.keys(entry.env)) if (typeof entry.env[name] === 'string') env[name] = entry.env[name];
    }
    const headers = {};
    if (entry.headers !== null && typeof entry.headers === 'object' && !Array.isArray(entry.headers)) {
      for (const name of Object.keys(entry.headers)) if (typeof entry.headers[name] === 'string') headers[name] = entry.headers[name];
    }
    servers.push({ serverName: key, transport: transport, command: command, url: url, args: args, env: env, headers: headers });
  }
  return { ok: true, servers: servers };
}

/* ───────────────────────── HTTP ───────────────────────── */


function send(response, status, body) {
  try {
    const payload = JSON.stringify(body);
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-length': Buffer.byteLength(payload),
    });
    response.end(payload);
  } catch {
    /* socket 没了 */
  }
}

function trustedRequest(request) {
  const host = request?.headers?.host;
  if (typeof host !== 'string' || host === '') return false;
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  const origin = request?.headers?.origin;
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function browserSession(ctx, request, scoped) {
  let auth = null;
  for (const scope of [scoped, ctx]) {
    let found = null;
    try {
      found = typeof scope?.get === 'function' ? scope.get('connection') : null;
    } catch {
      found = null;
    }
    if (found !== null && found !== undefined) {
      auth = found.browserAuth ?? null;
      break;
    }
  }
  if (auth === null || auth === undefined || typeof auth.isAuthenticated !== 'function') return null;
  const secure = safe(() => scoped?.webServer?.protocol === 'https:', false);
  return safe(() => auth.isAuthenticated(request, secure) === true, false);
}

function readBody(request, response, then) {
  const chunks = [];
  let length = 0;
  let done = false;
  request.on('data', (chunk) => {
    if (done) return;
    length += chunk.length;
    if (length > 64 * 1024) {
      done = true;
      send(response, 413, { ok: false, error: '请求体过大' });
      return;
    }
    chunks.push(chunk);
  });
  request.on('error', () => {
    if (done) return;
    done = true;
    send(response, 400, { ok: false, error: '请求读取失败' });
  });
  request.on('end', () => {
    if (done) return;
    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      send(response, 400, { ok: false, error: '请求体不是合法 JSON' });
      return;
    }
    then(payload);
  });
}

function slugOf(value) {
  const slug = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug === '' ? 'server' : slug.slice(0, 24);
}

function handleConfig(ctx, scoped, request, response, hooks) {
  readBody(request, response, (payload) => {
    const action = typeof payload?.action === 'string' ? payload.action : 'load';
    if (action === 'load') return send(response, 200, Object.assign({ ok: true }, readConfig()));
    if (action !== 'save') return send(response, 400, { ok: false, error: '未知的 action：' + action });
    const text = typeof payload?.text === 'string' ? payload.text : '';
    const parsed = parseServersJson(text);
    if (parsed.ok !== true) return send(response, 400, { ok: false, error: parsed.error });

    /* 写盘：先把用户手改的内容原样落盘，这样它成为唯一真相。 */
    try {
      writeFileSync(configPath, text.endsWith('\n') ? text : text + '\n', 'utf8');
    } catch (error) {
      return send(response, 500, { ok: false, error: '写配置文件失败：' + String(error) });
    }

    /* 再把这份文件里的每一条同步成受管条目，使它们立刻出现在列表里。 */
    const state = readState();
    const previous = new Map();
    for (const item of state.added) if (item.source === 'config') previous.set(item.serverName, item);
    state.added = state.added.filter((item) => item.source !== 'config');

    const live = new Set();
    for (const server of configuredServers(loaderRows(ctx))) {
      live.add(server.id);
      live.add(server.serverName);
    }
    for (const item of state.added) live.add(item.serverName);

    for (const entry of parsed.servers) {
      const existing = previous.get(entry.serverName);
      let id = existing === undefined ? 'mcp-' + slugOf(entry.serverName) : existing.id;
      const base = id;
      let n = 2;
      while (live.has(id) && (existing === undefined || id !== existing.id)) {
        id = base + '-' + n;
        n += 1;
      }
      live.add(id);
      state.added.push({
        id: id,
        serverName: entry.serverName,
        transport: entry.transport,
        source: 'config',
        command: entry.command,
        url: entry.url,
        args: entry.args,
        env: entry.env,
        headers: entry.headers,
      });
      if (state.overrides[id] === undefined) state.overrides[id] = true;
    }

    /* 从文件里消失的条目，连同它的开关记录一起清掉。 */
    const kept = new Set(parsed.servers.map((entry) => entry.serverName));
    for (const [serverName, item] of previous) {
      if (!kept.has(serverName)) delete state.overrides[item.id];
    }

    const saved = saveState(state);
    if (saved.ok !== true) return send(response, 500, { ok: false, error: saved.error });
    const patched = writePatch(state);
    if (patched.ok !== true) return send(response, 500, { ok: false, error: patched.error });

    send(response, 200, { ok: true, path: configPath, imported: parsed.servers.length, restartRequired: true });
  });
}

function handlePrefs(ctx, scoped, request, response, hooks) {
  readBody(request, response, (payload) => {
    if (typeof payload?.sidebarPanel !== "boolean") {
      return send(response, 400, { ok: false, error: '缺少 sidebarPanel（布尔值）' });
    }
    const state = readState();
    state.prefs.sidebarPanel = payload.sidebarPanel;
    const saved = saveState(state);
    if (saved.ok !== true) return send(response, 500, { ok: false, error: saved.error });
    send(response, 200, { ok: true, prefs: { sidebarPanel: state.prefs.sidebarPanel } });
  });
}

function handleToggle(ctx, scoped, request, response, hooks) {
  readBody(request, response, (payload) => {
    const id = typeof payload?.id === 'string' ? payload.id : '';
    const enabled = payload?.enabled === true;
    if (id === '') return send(response, 400, { ok: false, error: '缺少 id' });
    const state = readState();
    const mounted = configuredServers(loaderRows(ctx)).some((s) => s.id === id);
    const added = state.added.some((item) => item.id === id);
    if (!mounted && !added) return send(response, 404, { ok: false, error: '没有这个 MCP 条目：' + id });
    state.overrides[id] = enabled;
    const saved = saveState(state);
    if (saved.ok !== true) return send(response, 500, { ok: false, error: saved.error });
    const patched = writePatch(state);
    if (patched.ok !== true) return send(response, 500, { ok: false, error: patched.error });
    send(response, 200, { ok: true, id: id, enabled: enabled, restartRequired: true });
  });
}

function handleTool(ctx, scoped, request, response, hooks) {
  readBody(request, response, (payload) => {
    const serverName = typeof payload?.serverName === 'string' ? payload.serverName : '';
    const raw = typeof payload?.tool === 'string' ? payload.tool : '';
    const enabled = payload?.enabled === true;
    if (serverName === '' || raw === '') return send(response, 400, { ok: false, error: '缺少 serverName 或 tool' });

    /* 只接受此刻真的注册着的工具，避免往状态里写垃圾。 */
    const identity = identityOf(TOOL_PREFIX + serverName + '__' + raw);
    const known = safe(() => liveTools(ctx), null);
    const real = Array.isArray(known) && known.some((tool) => tool.name === (identity === null ? '' : TOOL_PREFIX + serverName + '__' + raw));
    if (!real) return send(response, 404, { ok: false, error: '没有这个工具：' + serverName + '/' + raw });

    const state = readState();
    const list = Array.isArray(state.tools[serverName]) ? state.tools[serverName].slice() : [];
    const at = list.indexOf(raw);
    if (enabled === true) {
      if (at >= 0) list.splice(at, 1);
    } else if (at < 0) {
      list.push(raw);
    }
    if (list.length === 0) delete state.tools[serverName];
    else state.tools[serverName] = list;
    const saved = saveState(state);
    if (saved.ok !== true) return send(response, 500, { ok: false, error: saved.error });

    /* 立刻把已经建好的 agent 作用域收紧或放开，不用等下一轮。 */
    if (typeof hooks?.reapply === 'function') safe(() => hooks.reapply(), undefined);

    send(response, 200, { ok: true, serverName: serverName, tool: raw, enabled: enabled, restartRequired: false });
  });
}

function handleAdd(ctx, scoped, request, response, hooks) {
  readBody(request, response, (payload) => {
    const serverName = typeof payload?.serverName === 'string' ? payload.serverName.trim() : '';
    const transport = payload?.transport === 'streamable-http' ? 'streamable-http' : 'stdio';
    const command = typeof payload?.command === 'string' ? payload.command.trim() : '';
    const url = typeof payload?.url === 'string' ? payload.url.trim() : '';
    const args = Array.isArray(payload?.args) ? payload.args.filter((a) => typeof a === 'string' && a !== '') : [];
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(serverName)) {
      return send(response, 400, { ok: false, error: '名称只能用字母、数字、下划线和短横线，1-32 个字符' });
    }
    if (transport === 'stdio' && command === '') return send(response, 400, { ok: false, error: 'stdio 需要启动命令' });
    if (transport === 'streamable-http' && !/^https?:\/\//.test(url)) return send(response, 400, { ok: false, error: 'HTTP 需要以 http:// 或 https:// 开头的地址' });
    const state = readState();
    const taken = new Set();
    for (const server of configuredServers(loaderRows(ctx))) {
      taken.add(server.id);
      taken.add(server.serverName);
    }
    for (const item of state.added) {
      taken.add(item.id);
      taken.add(item.serverName);
    }
    if (taken.has(serverName)) return send(response, 409, { ok: false, error: '已经有同名或同 id 的条目：' + serverName });
    const base = 'mcp-' + slugOf(serverName);
    let id = base;
    let n = 2;
    while (taken.has(id)) {
      id = base + '-' + n;
      n += 1;
    }
    state.added.push({ id: id, serverName: serverName, transport: transport, source: 'dialog', command: command, url: url, args: args, env: {}, headers: {} });
    state.overrides[id] = true;
    const saved = saveState(state);
    if (saved.ok !== true) return send(response, 500, { ok: false, error: saved.error });
    const patched = writePatch(state);
    if (patched.ok !== true) return send(response, 500, { ok: false, error: patched.error });
    send(response, 200, { ok: true, id: id, serverName: serverName, restartRequired: true });
  });
}

function handleRemove(ctx, scoped, request, response, hooks) {
  readBody(request, response, (payload) => {
    const id = typeof payload?.id === 'string' ? payload.id : '';
    if (id === '') return send(response, 400, { ok: false, error: '缺少 id' });
    const state = readState();
    const target = state.added.find((item) => item.id === id);
    const mounted = configuredServers(loaderRows(ctx)).some((s) => s.id === id);
    if (target) {
      state.added = state.added.filter((item) => item.id !== id);
      delete state.overrides[id];
      delete state.tools[target.serverName];
    } else if (mounted) {
      /* 原生条目不能从 state.added 移除，改为在受管块里禁用它的 loader 行。 */
      state.overrides[id] = false;
    } else {
      return send(response, 404, { ok: false, error: '没有这个 MCP 条目：' + id });
    }
    const saved = saveState(state);
    if (saved.ok !== true) return send(response, 500, { ok: false, error: saved.error });
    const patched = writePatch(state);
    if (patched.ok !== true) return send(response, 500, { ok: false, error: patched.error });
    send(response, 200, { ok: true, id: id, restartRequired: true });
  });
}

function handleReconnect(ctx, scoped, request, response, hooks) {
  readBody(request, response, async (payload) => {
    const id = typeof payload?.id === 'string' ? payload.id : '';
    if (id === '') return send(response, 400, { ok: false, error: '缺少 id' });
    let loader = null;
    try { loader = typeof ctx?.get === 'function' ? ctx.get('loader') : null; } catch { loader = null; }
    if (loader === null || typeof loader !== 'object' || typeof loader.entries !== 'function') {
      return send(response, 503, { ok: false, error: '找不到 loader 服务，无法重连' });
    }
    let target = null;
    try {
      for (const entry of loader.entries()) {
        const options = entry && entry.options ? entry.options : entry;
        if (options && options.id === id && options.name === BRIDGE_PLUGIN) { target = entry; break; }
      }
    } catch (error) {
      return send(response, 500, { ok: false, error: '查找条目失败：' + String(error) });
    }
    if (target === null || typeof target.update !== 'function') {
      return send(response, 404, { ok: false, error: '没有这个 MCP 的 loader 条目：' + id });
    }
    try {
      /* force=true 让 cordis 强制重启这个插件实例：dispose 旧连接 -> 重连 -> 重新注册工具。 */
      await target.update(target.options, false, true);
      send(response, 200, { ok: true, id: id, restartRequired: false });
    } catch (error) {
      send(response, 500, { ok: false, error: '重连失败：' + String(error) });
    }
  });
}

function guarded(ctx, scoped, request, response, handler, hooks) {
  if (!trustedRequest(request)) return send(response, 403, { ok: false, error: '只接受本机同源请求' });
  if (browserSession(ctx, request, scoped) === false) {
    return send(response, 401, { ok: false, error: '这个改动必须来自 DSH 窗口' });
  }
  try {
    handler(ctx, scoped, request, response, hooks);
  } catch (error) {
    send(response, 500, { ok: false, error: String(error) });
  }
}

function registerRoutes(ctx, warn, hooks) {
  if (typeof ctx?.inject !== 'function') return;
  try {
    ctx.inject(['webServer'], (scoped) => {
      const server = safe(() => scoped?.webServer, null);
      if (server === null || typeof server.register !== 'function') {
        warn('这个组合里没有 web server：MCP 面板会一直是空的');
        return;
      }
      try {
        server.register({
          kind: 'exact',
          path: ROUTE_STATUS,
          handler: (request, response) => {
            const method = typeof request?.method === 'string' ? request.method : 'GET';
            if (method !== 'GET' && method !== 'HEAD') return send(response, 405, { error: 'method not allowed' });
            try {
              send(response, 200, buildReport(ctx));
            } catch (error) {
              send(response, 200, { version: 4, error: String(error), servers: [], orphans: [], counts: { servers: 0, tools: 0, enabledTools: 0, enabled: 0 } });
            }
          },
        });
        const post = (path, handler) => server.register({
          kind: 'exact',
          path: path,
          handler: (request, response) => {
            if (request?.method !== 'POST') return send(response, 405, { ok: false, error: '只接受 POST' });
            guarded(ctx, scoped, request, response, handler, hooks);
          },
        });
        post(ROUTE_TOGGLE, handleToggle);
        post(ROUTE_TOOL, handleTool);
        post(ROUTE_CONFIG, handleConfig);
        post(ROUTE_PREFS, handlePrefs);
        post(ROUTE_ADD, handleAdd);
        post(ROUTE_REMOVE, handleRemove);
        post(ROUTE_RECONNECT, handleReconnect);
      } catch (error) {
        warn('注册路由失败：' + String(error));
      }
    });
  } catch (error) {
    warn('注入 web server 失败：' + String(error));
  }
}

export function apply(ctx) {
  try {
    const logger = safe(() => ctx?.logger, null);
    const warn = (message) => {
      try {
        if (logger && typeof logger.warn === 'function') logger.warn('[dsh-mcp-viewer] ' + message);
      } catch {
        /* 打日志本身不能成为故障 */
      }
    };
    const hooks = registerToolGate(ctx, warn);
    registerRoutes(ctx, warn, hooks);
  } catch {
    /* apply() 绝不抛 */
  }
}

export default { name: name, inject: inject, apply: apply };
