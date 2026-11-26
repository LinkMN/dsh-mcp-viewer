# dsh-mcp-viewer

DSH 的 MCP 面板：中文界面，默认折叠，带开关。

## 界面

设置 → 左侧栏 → **MCP 服务**。

顶部一行：**添加 MCP**、配置文件按钮（直接编辑 profile 的 `mcp.json`）。

- **搜索框「搜索 MCP」**：按服务器名或工具名过滤；右侧 **MCP Hub** 链接指向官方 registry；
- **「我的 MCP（N）」** 区块头，右边显示「N 启用」；
- **每个服务器一行，默认折叠**：头像、名字、状态点、副标题「来自插件 <id> · N/M 个工具已启用」；
- **只有一层折叠**：点行展开后，直接看到它的全部工具标签（不截断、不留 `+N`），没有二级折叠；
- **工具标签本身就是开关**：点一下停用（出现删除线），再点恢复；停用只影响模型可见的工具表，立即生效；
- **行右侧三个控件**：开关（启停整个 MCP，需重启）、重新连接 ⟳、删除 🗑。

## 三个按钮各自做什么

| 按钮 | 作用 | 何时生效 |
| --- | --- | --- |
| 开关 | 写覆盖块，启用/停用整个 MCP 的 loader 条目 | 重启 DSH |
| ⟳ 重新连接 | 强制重启该 MCP 的 plugin 实例，让工具重新注册 | 立即 |
| 🗑 删除 | 本插件新增的条目直接移除；loader 里原有的条目写 `disabled: true` 停用 | 重启 DSH |

**重新连接**解决的是：MCP 停用再启用后，工具有时没重新注册回来（mcp-client 的重连预算耗尽会注销工具）。它调用 loader 条目的 `update(options, false, true)` 强制重启该实例。

「删除」对非本插件新增的条目（例如 `dsh-windows-mcp` 挂的 `windows-mcp-bridge`）不会删文件，只把它在受管块里标成 `disabled: true`，随时可以再启用。

## 开关怎么工作

点开关 → 写 profile 的 `cordis.patch.yml`：

    # >>> dsh-mcp-viewer: managed >>>
    - id: windows-mcp-bridge
      disabled: true
    # <<< dsh-mcp-viewer: managed <<<

利用的是 patch 层本来就有、也本来就最容易被写错的语义：**裸 `- id:` 行是按 id 覆盖已存在条目**。
（新增条目必须写成 `- insert:` 列表 —— 这个坑我在装插件时踩过一次。）

要点：

- 只写这一段标记块，文件其余部分原样保留；删掉整段就等于把开关全部还原；
- 同一条目反复开关只改那一行，不会重复堆叠；
- **重启 DSH 才生效** —— 界面上会标「待重启」；
- 写之前要过两道栅栏：Host 必须是回环地址、Origin 必须同源；能拿到 `connection.browserAuth` 时还要求带 GUI 的签名会话 cookie，所以脚本或模型不能自己把某个 server 打开。

## 添加 MCP

两种方式，都写 profile 的 `mcp.json`（`mcpServers` 对象），并同步成受管 `- insert:` 行：

- **添加 MCP 弹窗**：填名称、传输方式（stdio / HTTP）、启动命令与参数，或 URL；
- **配置文件视图**：直接编辑整份 JSON（带行号），保存后按文件内容重建条目。

还可以把侧边栏开关打开：设置 → 插件 → 已安装 → dsh-mcp-viewer 的配置卡里，勾「在左侧边栏显示 MCP 服务」。

## 数据从哪来

| 事实 | 来源 | 缺失时 |
| --- | --- | --- |
| 配了哪些 server | `ctx.get('loader').entries()`，筛 `name === '@deepseek-ai/dsh-mcp-client'` | 空列表，照常出面板 |
| 哪些工具真的在 | `ctx.get('tools').schemas()`，筛 `mcp__<server>__<raw>` | 空列表，照常出面板 |
| 开关状态 | 覆盖块 | 没有覆盖时用 loader 的实时值 |
| 哪些是本插件新增的 | 状态文件的 `added` 数组 | 都算原生条目 |

两次 `ctx.get()` 都包在 `safe()` 里：任何服务缺席都只让对应字段空着，**绝不让 `apply()` 抛**。
`inject` 声明为空数组，所以任何 composition 都激活得起来。

## 接口

    GET  /dsh-mcp-viewer/api       完整报告（服务器、工具、开关状态、canToggle、prefs）
    POST /dsh-mcp-viewer/toggle    { id, enabled }
    POST /dsh-mcp-viewer/tool      { serverName, tool, enabled }
    POST /dsh-mcp-viewer/config    { action: 'load' | 'save', text? }
    POST /dsh-mcp-viewer/prefs     { sidebarPanel }
    POST /dsh-mcp-viewer/add       { serverName, transport, command|url, args }
    POST /dsh-mcp-viewer/remove    { id }
    POST /dsh-mcp-viewer/reconnect { id }

## 安装

    cp -r dsh-mcp-viewer ~/.dsh/profiles/<profile>/local-plugins/

然后在 profile 的 `package.json` 里登记：

    "dependencies": { "dsh-mcp-viewer": "file:./local-plugins/dsh-mcp-viewer" }
    "dsh": { "profile": { "bundles": [ ..., "dsh-mcp-viewer" ] } }

重启 DSH。

> 注意：`node_modules/` 与 `local-plugins/` 是两份独立拷贝，改完源码两边都要同步，否则加载的是旧版。

## 刻意不做的事

- 不做 OAuth / API Key / 凭证存储；
- 不拉远程 catalogue，不内置数据源目录；
- 不做 SSE 实时推送 —— 一次 GET，手动刷新；
- 不做工具治理、会话注入、健康检查、快照备份。

## 测试

    node test/smoke.mjs         # Host：假 loader/tools/webServer + 临时 profile，覆盖全部 8 条路由
    node test/client-smoke.mjs  # Client：假 React，覆盖折叠、开关、删除、重连、整页渲染

两个都不需要 DSH 在跑，也不需要装依赖。

## 结构

    lib/index.js       Host：读 loader + tools；8 条路由；受管块写入
    lib/client.js      Client：设置页、侧边栏面板、插件配置卡
    variants/          试过又退掉的界面版本（未加载）
    cordis.patch.yml   bundle 挂载行

## 许可

MIT。
