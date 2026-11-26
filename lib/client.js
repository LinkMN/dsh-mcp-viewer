window.__ModuleLoader__.load({
  id: 'dsh-mcp-viewer',
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;

    var React = require('react');

    var PACKAGE_ID = 'dsh-mcp-viewer';
    var API_STATUS = '/dsh-mcp-viewer/api';
    var API_TOGGLE = '/dsh-mcp-viewer/toggle';
    var API_TOOL = '/dsh-mcp-viewer/tool';
    var API_CONFIG = '/dsh-mcp-viewer/config';
    var API_PREFS = '/dsh-mcp-viewer/prefs';
    var API_ADD = '/dsh-mcp-viewer/add';
    var API_REMOVE = '/dsh-mcp-viewer/remove';
    var API_RECONNECT = '/dsh-mcp-viewer/reconnect';
    var SETTINGS_SLOT = 'settings.section';
    var SETTINGS_ENTRY_ID = 'mcp-viewer-settings';
    var SETTINGS_ORDER = 63;
    var SETTINGS_NAV_ICON_SLOT = 'settings.section.icon';
    var STYLE_ID = PACKAGE_ID + '-styles';
    /* 侧边栏面板：`main` 槽位一份整页 + `sidebar.panellist` 一行导航，两者用同一个 key。 */
    var PANEL_ID = 'mcp-viewer';
    var MAIN_SLOT = 'main';
    var PANEL_LIST_SLOT = 'sidebar.panellist';
    /* MCP 官方 registry 的浏览入口。这是外部站点，不是本插件的功能。 */
    var HUB_URL = 'https://registry.modelcontextprotocol.io';

    var inject = ['slots'];

    var CSS = [
      '.mq{display:flex;flex-direction:column;gap:16px;font-size:13px;',
      'color:var(--dsw-alias-label-primary);padding:4px 0 32px;max-width:900px}',
      '.mq__top{display:flex;align-items:flex-start;gap:12px}',
      '.mq__titleblock{flex:1 1 auto;min-width:0}',
      '.mq__title{margin:0;font-size:17px;font-weight:650;letter-spacing:-.01em;line-height:1.3}',
      '.mq__sub{margin:3px 0 0;font-size:12.5px;line-height:1.5;',
      'color:var(--dsw-alias-label-secondary)}',
      '.mq__btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;',
      'height:34px;padding:0 14px;font:inherit;font-size:13px;cursor:pointer;',
      'border-radius:9px;border:1px solid var(--dsw-alias-border-l1);',
      'background:transparent;color:var(--dsw-alias-label-primary);white-space:nowrap}',
      '@media (hover:hover){.mq__btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}',
      '.mq__btn:disabled{opacity:.5;cursor:not-allowed}',
      '.mq__btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.mq__btn--primary{background:var(--dsw-alias-brand-primary);border-color:transparent;',
      'color:var(--dsw-alias-bg-layer-1)}',
      '.mq__iconbtn{display:inline-flex;align-items:center;justify-content:center;',
      'width:34px;height:34px;flex:none;padding:0;cursor:pointer;border-radius:9px;',
      'border:1px solid var(--dsw-alias-border-l1);background:transparent;',
      'color:var(--dsw-alias-label-secondary)}',
      '@media (hover:hover){.mq__iconbtn:hover:not(:disabled){',
      'background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}}',
      '.mq__iconbtn:disabled{opacity:.5;cursor:not-allowed}',
      '.mq__iconbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.mq__del{display:inline-flex;align-items:center;justify-content:center;flex:none;',
      'width:30px;height:30px;padding:0;margin-left:2px;cursor:pointer;border-radius:8px;',
      'border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);opacity:.6;line-height:1}',
      '@media (hover:hover){.mq__del:hover:not(:disabled){',
      'background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-status-error, #d92d20);opacity:1}}',
      '.mq__del:disabled{opacity:.5;cursor:not-allowed}',
      '.mq__del:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.mq__reconn{display:inline-flex;align-items:center;justify-content:center;flex:none;',
      'width:30px;height:30px;padding:0;margin-left:2px;cursor:pointer;border-radius:8px;',
      'border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);opacity:.6;line-height:1}',
      '@media (hover:hover){.mq__reconn:hover:not(:disabled){',
      'background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-brand-primary);opacity:1}}',
      '.mq__reconn:disabled{opacity:.35;cursor:not-allowed}',
      '.mq__reconn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.mq__tools{display:flex;gap:10px;align-items:center}',
      '.mq__searchwrap{position:relative;flex:1 1 auto;min-width:0}',
      '.mq__searchicon{position:absolute;left:11px;top:50%;transform:translateY(-50%);',
      'width:14px;height:14px;color:var(--dsw-alias-label-secondary);pointer-events:none}',
      '.mq__search{width:100%;height:38px;padding:0 12px 0 33px;font:inherit;font-size:13px;',
      'border-radius:9px;border:1px solid var(--dsw-alias-border-l1);',
      'background:transparent;color:var(--dsw-alias-label-primary)}',
      '.mq__search::placeholder{color:var(--dsw-alias-label-secondary)}',
      '.mq__search:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.mq__hublink{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;',
      'font-size:13px;text-decoration:none;border-radius:9px;white-space:nowrap;',
      'border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}',
      '@media (hover:hover){.mq__hublink:hover{background:var(--dsw-alias-interactive-bg-hover)}}',
      '.mq__sechead{display:flex;align-items:baseline;gap:10px;margin-top:2px}',
      '.mq__sechead h4{margin:0;font-size:13.5px;font-weight:650}',
      '.mq__grow{flex:1 1 auto}',
      '.mq__seccount{font-size:12.5px;color:var(--dsw-alias-label-secondary)}',
      '.mq__list{display:flex;flex-direction:column;gap:2px;margin-top:-6px}',
      '.mq__row{display:flex;flex-direction:column}',
      '.mq__header{display:flex;align-items:center;gap:11px;padding:8px 2px;min-height:46px}',
      '.mq__disclose{display:flex;align-items:center;gap:11px;flex:1 1 auto;min-width:0;',
      'padding:2px 4px 2px 0;margin:0;font:inherit;text-align:left;background:transparent;',
      'border:none;color:inherit;cursor:pointer;border-radius:8px}',
      '.mq__disclose:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);',
      'outline-offset:-2px}',
      '.mq__caret{width:13px;height:13px;flex:none;color:var(--dsw-alias-label-secondary);',
      'transition:transform .15s ease;transform:rotate(0)}',
      '.mq__caret[data-open="1"]{transform:rotate(90deg)}',
      '@media (prefers-reduced-motion:reduce){.mq__caret{transition:none}}',
      '.mq__avatar{width:34px;height:34px;flex:none;border-radius:9px;display:flex;',
      'align-items:center;justify-content:center;font-size:15px;font-weight:600;',
      'color:#fff;letter-spacing:.02em;text-transform:uppercase}',
      '.mq__names{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.mq__nameline{display:flex;align-items:center;gap:6px;min-width:0}',
      '.mq__name{font-size:13.5px;font-weight:600;overflow:hidden;',
      'text-overflow:ellipsis;white-space:nowrap}',
      '.mq__dot{width:6px;height:6px;border-radius:999px;flex:none;',
      'background:var(--dsw-alias-label-secondary)}',
      '.mq__dot[data-on="1"]{background:#12b76a}',
      '.mq__desc{font-size:12px;color:var(--dsw-alias-label-secondary);',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.mq__chips{display:flex;flex-wrap:wrap;gap:8px;padding:2px 0 10px 58px}',
      /* 标签要能一眼读清：给一层明确的浅灰底 + 稍深的文字，而不是只靠边框。
         浅色主题下这层灰比 bg-layer-2 更实，深色主题下也仍然比背景亮一点。 */
      '.mq__chip{font:inherit;font-size:12px;line-height:1.5;padding:3px 10px;',
      'border-radius:7px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-secondary) 50%,transparent);',
      'background:color-mix(in srgb,var(--dsw-alias-label-secondary) 34%,var(--dsw-alias-bg-layer-1));',
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
      'color:var(--dsw-alias-label-primary);white-space:nowrap;cursor:pointer;',
      'transition:background-color .12s ease,border-color .12s ease,color .12s ease}',
      '@media (hover:hover){.mq__chip:hover:not(:disabled){',
      'border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);',
      'background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-layer-1))}}',
      '.mq__chip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.mq__chip:disabled{opacity:.55;cursor:not-allowed}',
      /* 停用：去掉填充、降对比、加删除线 —— 与「可点的灰」区分开，而不是同样糊成一片。 */
      '.mq__chip[data-off="1"]{background:transparent;',
      'border-color:color-mix(in srgb,var(--dsw-alias-label-secondary) 26%,transparent);',
      'text-decoration:line-through;color:var(--dsw-alias-label-secondary)}',
      '.mq__chip--more{font-family:inherit;color:var(--dsw-alias-label-secondary)}',
      '.mq__empty{margin:8px 0 0;padding:28px 16px;text-align:center;font-size:12.5px;',
      'color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l1);',
      'border-radius:10px}',
      '.mq__err{margin:0;font-size:12.5px;color:var(--dsw-alias-state-error-primary)}',
      '.mq__skel{height:50px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);opacity:.5}',
      '.mq__switch{position:relative;flex:none;width:38px;height:21px;padding:0;',
      'border-radius:999px;border:1px solid var(--dsw-alias-border-l1);cursor:pointer;',
      'background:var(--dsw-alias-bg-layer-2);',
      'transition:background-color .16s ease,border-color .16s ease}',
      '.mq__switch[data-on="1"]{background:#12b76a;border-color:#12b76a}',
      '.mq__switch:disabled{opacity:.45;cursor:not-allowed}',
      '.mq__switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.mq__knob{position:absolute;top:2px;left:2px;width:15px;height:15px;',
      'border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);',
      'transition:transform .16s ease}',
      '.mq__switch[data-on="1"] .mq__knob{transform:translateX(17px)}',
      '@media (prefers-reduced-motion:reduce){.mq__switch,.mq__knob{transition:none}}',
      '.mq__mask{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.38);',
      'display:flex;align-items:center;justify-content:center;padding:24px}',
      '.mq__modal{width:min(460px,100%);border-radius:14px;',
      'background:var(--dsw-alias-bg-layer-1);',
      'border:1px solid var(--dsw-alias-border-l1);',
      'box-shadow:0 18px 48px rgba(0,0,0,.3);display:flex;flex-direction:column;',
      'max-height:100%;overflow:auto}',
      '.mq__modalhead{display:flex;align-items:center;gap:10px;padding:18px 20px 6px}',
      '.mq__modalhead h4{margin:0;font-size:15px;font-weight:650;flex:1 1 auto}',
      '.mq__x{width:28px;height:28px;padding:0;display:inline-flex;align-items:center;',
      'justify-content:center;border-radius:7px;border:none;background:transparent;',
      'color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit}',
      '@media (hover:hover){.mq__x:hover{background:var(--dsw-alias-interactive-bg-hover)}}',
      '.mq__modalbdy{display:flex;flex-direction:column;gap:12px;padding:12px 20px 4px}',
      '.mq__field{display:flex;flex-direction:column;gap:5px}',
      '.mq__label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.mq__input{height:34px;padding:0 11px;font:inherit;font-size:13px;border-radius:8px;',
      'border:1px solid var(--dsw-alias-border-l1);background:transparent;',
      'color:var(--dsw-alias-label-primary);width:100%}',
      '.mq__input:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.mq__seg{display:flex;gap:6px}',
      '.mq__segbtn{flex:1 1 0;height:32px;font:inherit;font-size:12.5px;cursor:pointer;',
      'border-radius:8px;border:1px solid var(--dsw-alias-border-l1);',
      'background:transparent;color:var(--dsw-alias-label-secondary)}',
      '.mq__segbtn[data-on="1"]{border-color:var(--dsw-alias-brand-primary);',
      'color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.mq__modalbtns{display:flex;justify-content:flex-end;gap:8px;padding:16px 20px 18px}',
      '.mq__hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin:0}',
      '.mq__cfgbar{display:flex;align-items:center;gap:10px;padding:10px 0;',
      'border-top:1px solid var(--dsw-alias-border-l1);',
      'border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.mq__back{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 10px 0 6px;',
      'font:inherit;font-size:13px;cursor:pointer;border-radius:8px;border:none;',
      'background:transparent;color:var(--dsw-alias-label-primary)}',
      '@media (hover:hover){.mq__back:hover{background:var(--dsw-alias-interactive-bg-hover)}}',
      '.mq__path{font-size:12px;color:var(--dsw-alias-label-secondary);word-break:break-all;padding:10px 0}',
      '.mq__editor{display:flex;border:1px solid var(--dsw-alias-border-l1);',
      'border-radius:9px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);min-height:220px}',
      '.mq__gutter{flex:none;padding:10px 8px 10px 10px;text-align:right;user-select:none;',
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.6;',
      'color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);',
      'border-right:1px solid var(--dsw-alias-border-l1);min-width:38px;overflow:hidden}',
      '.mq__code{flex:1 1 auto;min-width:0;padding:10px 12px;border:none;resize:vertical;',
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.6;',
      'background:transparent;color:var(--dsw-alias-label-primary);tab-size:2;',
      'white-space:pre;overflow:auto;min-height:220px}',
      '.mq__code:focus-visible{outline:none}',
      '.mq__editor:focus-within{box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}',
      '.mq__cfgfoot{display:flex;align-items:center;gap:10px;padding-top:10px}',
      '.mq__sideopt{display:flex;align-items:center;gap:10px;padding:2px 0}',
      '.mq__sidelabel{font-size:12.5px;color:var(--dsw-alias-label-secondary)}',
      '.mq__plugcfg{display:flex;align-items:center;gap:10px;padding:6px 0}',
      /* 侧边栏整页：面板宽度比设置页窄，收紧横向留白。 */
      '.mq__panel{padding:14px 16px 32px;max-width:none}',
      '.mq__panel .mq__chips{padding-left:0}',
      '.mq__panel .mq__title{font-size:15px}',
    ].join('');

    function installStyles() {
      try {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID) !== null) return;
        var element = document.createElement('style');
        element.id = STYLE_ID;
        element.textContent = CSS;
        document.head.appendChild(element);
      } catch (ignored) {
        /* 样式是可选的 */
      }
    }

    function request(url, options) {
      return fetch(url, options).then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok || body.error) {
            return { ok: false, error: (body && body.error) || ('HTTP ' + response.status) };
          }
          return body;
        });
      }).catch(function (error) {
        return { ok: false, error: String((error && error.message) || error) };
      });
    }

    function fetchReport() {
      return request(API_STATUS, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        cache: 'no-store',
      }).then(function (body) { return body; });
    }

    function postJson(url, payload) {
      return request(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    function postToggle(id, enabled) { return postJson(API_TOGGLE, { id: id, enabled: enabled }); }
    function postPrefs(enabled) { return postJson(API_PREFS, { sidebarPanel: enabled }); }
    function postTool(serverName, tool, enabled) {
      return postJson(API_TOOL, { serverName: serverName, tool: tool, enabled: enabled });
    }
    function postAdd(config) { return postJson(API_ADD, config); }
    function postRemove(id) { return postJson(API_REMOVE, { id: id }); }
    function postReconnect(id) { return postJson(API_RECONNECT, { id: id }); }
    function fetchConfig() { return postJson(API_CONFIG, { action: 'load' }); }
    function saveConfig(text) { return postJson(API_CONFIG, { action: 'save', text: text }); }

    var AVATAR_COLORS = ['#12b76a', '#f79009', '#7a5af8', '#0ba5ec', '#ee46bc', '#ef4444', '#6172f3'];
    function avatarColor(serverName) {
      var sum = 0;
      for (var i = 0; i < serverName.length; i += 1) sum = (sum + serverName.charCodeAt(i)) % 9973;
      return AVATAR_COLORS[sum % AVATAR_COLORS.length];
    }

    function Caret(props) {
      return React.createElement(
        'svg',
        { className: 'mq__caret', 'data-open': props.open ? '1' : '0', viewBox: '0 0 14 14',
          'aria-hidden': 'true', focusable: 'false' },
        React.createElement('path', {
          d: 'M4.8 2.6 9.4 7l-4.6 4.4', fill: 'none', stroke: 'currentColor',
          strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        }),
      );
    }

    function Switch(props) {
      return React.createElement(
        'button',
        {
          type: 'button',
          className: 'mq__switch',
          role: 'switch',
          'data-on': props.on ? '1' : '0',
          'aria-checked': props.on ? 'true' : 'false',
          'aria-label': props.label,
          title: props.title,
          disabled: props.disabled ? true : undefined,
          onClick: props.onClick,
        },
        React.createElement('span', { className: 'mq__knob' }),
      );
    }

    /* 一层折叠：点服务器行展开它下面的工具标签，标签本身是开关，没有再下一层。 */
    function ServerRow(props) {
      var server = props.server;
      var openState = React.useState(false);
      var open = openState[0];
      var setOpen = openState[1];

      var tools = Array.isArray(server.tools) ? server.tools : [];
      var enabled = server.enabled === true;
      var total = tools.length;
      var onCount = typeof server.enabledTools === 'number' ? server.enabledTools : total;
      var desc;
      if (!enabled) {
        desc = total === 0 ? '已停用' : '已停用 · 配置里有 ' + total + ' 个工具';
      } else if (total === 0) {
        desc = '已启用，尚未连接';
      } else {
        desc = '来自插件 ' + (server.id || server.serverName) + ' · ' + onCount + '/' + total + ' 个工具已启用';
      }

      /* 全部工具都显示出来：不截断、不留 +N。一屏放不下就换行，
         管理界面更需要“一眼看全”而不是省地方。 */
      var chips = tools.map(function (tool) {
        var on = tool.enabled !== false;
        return React.createElement(
          'button',
          {
            type: 'button',
            className: 'mq__chip',
            key: tool.publicName || tool.name,
            'data-off': on ? '0' : '1',
            'aria-pressed': on ? 'true' : 'false',
            'aria-label': (on ? '停用工具 ' : '启用工具 ') + tool.name,
            title: (on ? '点击停用' : '点击启用') + (tool.description ? '：' + tool.description : ''),
            disabled: props.canToggle !== true || props.busyTool !== '',
            onClick: function () { props.onTool(server, tool, !on); },
          },
          tool.name,
        );
      });

      return React.createElement(
        'div',
        { className: 'mq__row' },
        React.createElement(
          'div',
          { className: 'mq__header' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'mq__disclose',
              'aria-expanded': open ? 'true' : 'false',
              onClick: function () { setOpen(!open); },
            },
            React.createElement(Caret, { open: open }),
            React.createElement(
              'span',
              { className: 'mq__avatar', 'data-off': enabled ? '0' : '1',
                style: { background: avatarColor(server.serverName) } },
              String(server.serverName).slice(0, 1),
            ),
            React.createElement(
              'span',
              { className: 'mq__names' },
              React.createElement(
                'span',
                { className: 'mq__nameline' },
                React.createElement('span', { className: 'mq__name' }, server.serverName),
                React.createElement('span', { className: 'mq__dot', 'data-on': enabled ? '1' : '0' }),
              ),
              React.createElement('span', { className: 'mq__desc' }, desc),
            ),
          ),
          React.createElement(Switch, {
            on: enabled,
            disabled: props.busy || props.canToggle !== true,
            label: (enabled ? '停用 ' : '启用 ') + server.serverName,
            title: props.canToggle === true
              ? (enabled ? '停用，重启后生效' : '启用，重启后生效')
              : '找不到 cordis.patch.yml',
            onClick: function () { props.onToggle(server, !enabled); },
          }),
          React.createElement('button', {
                type: 'button',
                className: 'mq__reconn',
                title: '重新连接（工具没注册回来时点一下）',
                'aria-label': '重新连接 ' + server.serverName,
                disabled: props.busy || props.canToggle !== true || !enabled,
                onClick: function () { props.onReconnect(server); },
              }, React.createElement('svg', {
                viewBox: '0 0 24 24', width: 15, height: 15,
                fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8,
                'stroke-linecap': 'round', 'stroke-linejoin': 'round',
                'aria-hidden': 'true',
              },
                React.createElement('path', { d: 'M20 11a8 8 0 1 0-2.3 5.7' }),
                React.createElement('path', { d: 'M20 5v6h-6' }),
              )),
          React.createElement('button', {
                type: 'button',
                className: 'mq__del',
                title: '删除这个 MCP（移除后需重启生效）',
                'aria-label': '删除 ' + server.serverName,
                disabled: props.busy || props.canToggle !== true,
                onClick: function () { props.onRemove(server); },
              }, React.createElement('svg', {
                viewBox: '0 0 24 24', width: 15, height: 15,
                fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8,
                'stroke-linecap': 'round', 'stroke-linejoin': 'round',
                'aria-hidden': 'true',
              },
                React.createElement('path', { d: 'M3 6h18' }),
                React.createElement('path', { d: 'M8 6V4h8v2' }),
                React.createElement('path', { d: 'M6 6l1 14h10l1-14' }),
                React.createElement('path', { d: 'M10 10v6M14 10v6' }),
              )),
        ),
        open && chips.length > 0
          ? React.createElement('div', { className: 'mq__chips' }, chips)
          : null,
        open && total === 0
          ? React.createElement('p', { className: 'mq__desc', style: { padding: '0 0 12px 58px' } },
              enabled ? '还没有注册到工具。' : '这一行已停用，桥接从未连接。')
          : null,
      );
    }

    function AddDialog(props) {
      var nameState = React.useState('');
      var name = nameState[0];
      var setName = nameState[1];
      var transportState = React.useState('stdio');
      var transport = transportState[0];
      var setTransport = transportState[1];
      var commandState = React.useState('');
      var command = commandState[0];
      var setCommand = commandState[1];
      var urlState = React.useState('');
      var url = urlState[0];
      var setUrl = urlState[1];
      var argsState = React.useState('');
      var args = argsState[0];
      var setArgs = argsState[1];

      var submit = function () {
        props.onSubmit({
          serverName: name.trim(),
          transport: transport,
          command: transport === 'stdio' ? command.trim() : '',
          url: transport === 'streamable-http' ? url.trim() : '',
          args: transport === 'stdio'
            ? args.split(/\s+/).filter(function (a) { return a !== ''; })
            : [],
        });
      };

      return React.createElement(
        'div',
        { className: 'mq__mask', onClick: function (e) { if (e.target === e.currentTarget) props.onClose(); } },
        React.createElement(
          'div',
          { className: 'mq__modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': '添加 MCP' },
          React.createElement(
            'div',
            { className: 'mq__modalhead' },
            React.createElement('h4', null, '添加 MCP'),
            React.createElement('button', { type: 'button', className: 'mq__x', 'aria-label': '关闭', onClick: props.onClose }, '\u2715'),
          ),
          React.createElement(
            'div',
            { className: 'mq__modalbdy' },
            React.createElement(
              'div',
              { className: 'mq__field' },
              React.createElement('span', { className: 'mq__label' }, '名称'),
              React.createElement('input', {
                className: 'mq__input', value: name, placeholder: '例如 gearboy',
                onChange: function (e) { setName(e.target.value); },
              }),
              React.createElement('p', { className: 'mq__hint' }, '模型看到的工具会叫 mcp__<名称>__<工具>。'),
            ),
            React.createElement(
              'div',
              { className: 'mq__field' },
              React.createElement('span', { className: 'mq__label' }, '传输方式'),
              React.createElement(
                'div',
                { className: 'mq__seg' },
                React.createElement('button', {
                  type: 'button', className: 'mq__segbtn', 'data-on': transport === 'stdio' ? '1' : '0',
                  onClick: function () { setTransport('stdio'); },
                }, 'stdio'),
                React.createElement('button', {
                  type: 'button', className: 'mq__segbtn', 'data-on': transport === 'streamable-http' ? '1' : '0',
                  onClick: function () { setTransport('streamable-http'); },
                }, 'HTTP'),
              ),
            ),
            transport === 'stdio'
              ? React.createElement(
                  'div',
                  { className: 'mq__field' },
                  React.createElement('span', { className: 'mq__label' }, '启动命令'),
                  React.createElement('input', {
                    className: 'mq__input', value: command, placeholder: '例如 C:/Tools/gearboy.exe',
                    onChange: function (e) { setCommand(e.target.value); },
                  }),
                  React.createElement('span', { className: 'mq__label' }, '参数（空格分隔）'),
                  React.createElement('input', {
                    className: 'mq__input', value: args, placeholder: '例如 --mcp-stdio',
                    onChange: function (e) { setArgs(e.target.value); },
                  }),
                )
              : React.createElement(
                  'div',
                  { className: 'mq__field' },
                  React.createElement('span', { className: 'mq__label' }, '地址'),
                  React.createElement('input', {
                    className: 'mq__input', value: url, placeholder: '例如 http://127.0.0.1:7777/mcp',
                    onChange: function (e) { setUrl(e.target.value); },
                  }),
                ),
          ),
          React.createElement(
            'div',
            { className: 'mq__modalbtns' },
            React.createElement('button', { type: 'button', className: 'mq__btn', onClick: props.onClose }, '取消'),
            React.createElement('button', {
              type: 'button', className: 'mq__btn mq__btn--primary', disabled: props.busy,
              onClick: submit,
            }, props.busy ? '添加中…' : '添加'),
          ),
        ),
      );
    }

    function ConfigView(props) {
      var textState = React.useState('');
      var text = textState[0];
      var setText = textState[1];
      var pathState = React.useState('');
      var path = pathState[0];
      var setPath = pathState[1];
      var loadedState = React.useState(false);
      var loaded = loadedState[0];
      var setLoaded = loadedState[1];
      var busyState = React.useState(false);
      var busy = busyState[0];
      var setBusy = busyState[1];
      var errState = React.useState('');
      var error = errState[0];
      var setError = errState[1];
      var noteState = React.useState('');
      var note = noteState[0];
      var setNote = noteState[1];
      var gutterRef = React.useRef ? React.useRef(null) : null;

      React.useEffect(function () {
        fetchConfig().then(function (result) {
          if (result.ok !== true) {
            setError(String(result.error || '读取失败'));
            setLoaded(true);
            return;
          }
          setText(result.text || '');
          setPath(result.path || '');
          setLoaded(true);
        });
      }, []);

      var lines = text.split('\n');
      var numbers = [];
      for (var i = 1; i <= Math.max(lines.length, 1); i += 1) numbers.push(i);

      var save = function () {
        setBusy(true);
        setError('');
        saveConfig(text).then(function (result) {
          setBusy(false);
          if (result.ok !== true) {
            setError(String(result.error || '保存失败'));
            return;
          }
          setNote('已保存，导入 ' + result.imported + ' 个服务。重启 DSH 后生效。');
          if (typeof props.onSaved === 'function') props.onSaved();
        });
      };

      return React.createElement(
        'div',
        { className: 'mq__cfg' },
        React.createElement(
          'div',
          { className: 'mq__cfgbar' },
          React.createElement(
            'button',
            { type: 'button', className: 'mq__back', onClick: props.onBack },
            React.createElement('span', { 'aria-hidden': 'true' }, '\u2039'),
            '返回 MCP 列表',
          ),
          React.createElement('span', { className: 'mq__grow' }),
          React.createElement('button', { type: 'button', className: 'mq__btn', onClick: props.onBack }, '取消'),
          React.createElement('button', {
            type: 'button', className: 'mq__btn mq__btn--primary', disabled: busy || !loaded, onClick: save,
          }, busy ? '保存中…' : '保存'),
        ),
        path !== '' ? React.createElement('p', { className: 'mq__path' }, '配置文件路径：' + path) : null,
        !loaded
          ? React.createElement('div', { className: 'mq__skel' })
          : React.createElement(
              'div',
              { className: 'mq__editor' },
              React.createElement(
                'div',
                { className: 'mq__gutter', ref: gutterRef },
                numbers.map(function (n) { return React.createElement('div', { key: n }, n); }),
              ),
              React.createElement('textarea', {
                className: 'mq__code',
                value: text,
                spellCheck: false,
                'aria-label': 'MCP 配置文件内容',
                onChange: function (e) { setText(e.target.value); setNote(''); },
                onScroll: function (e) {
                  if (gutterRef !== null && gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
                },
              }),
            ),
        error !== '' ? React.createElement('p', { className: 'mq__err' }, error) : null,
        note !== '' ? React.createElement('p', { className: 'mq__hint' }, note) : null,
        React.createElement(
          'div',
          { className: 'mq__cfgfoot' },
          React.createElement('p', { className: 'mq__hint' },
            '支持标准 mcpServers 写法：',
            React.createElement('code', null, '{"name":{"command":"...","args":[...],"env":{...}}}'),
            ' 或 ', React.createElement('code', null, '{"name":{"url":"http://..."}}'),
            '。'),
        ),
      );
    }

    function McpViewerPage() {
      var reportState = React.useState(null);
      var report = reportState[0];
      var setReport = reportState[1];
      var busyState = React.useState(false);
      var busy = busyState[0];
      var setBusy = busyState[1];
      var queryState = React.useState('');
      var query = queryState[0];
      var setQuery = queryState[1];
      var viewState = React.useState('list');
      var view = viewState[0];
      var setView = viewState[1];
      var dialogState = React.useState(false);
      var dialog = dialogState[0];
      var setDialog = dialogState[1];
      var errState = React.useState('');
      var error = errState[0];
      var setError = errState[1];
      var pendingState = React.useState('');
      var pendingId = pendingState[0];
      var setPendingId = pendingState[1];
      var pendingToolState = React.useState('');
      var reconnectState = React.useState('');
      var reconnecting = reconnectState[0];
      var setReconnecting = reconnectState[1];
      var pendingTool = pendingToolState[0];
      var setPendingTool = pendingToolState[1];
      var addingState = React.useState(false);
      var adding = addingState[0];
      var setAdding = addingState[1];

      var load = React.useCallback(function () {
        setBusy(true);
        fetchReport().then(function (next) {
          setReport(next);
          setBusy(false);
        });
      }, []);

      React.useEffect(function () { load(); }, [load]);

      var patchServer = function (id, patch) {
        setReport(function (prev) {
          if (prev === null || !Array.isArray(prev.servers)) return prev;
          return Object.assign({}, prev, {
            servers: prev.servers.map(function (item) {
              return item.id === id ? Object.assign({}, item, patch) : item;
            }),
          });
        });
      };

      var onToggle = function (server, enabled) {
        setPendingId(server.id);
        postToggle(server.id, enabled).then(function (result) {
          setPendingId('');
          if (result.ok !== true) {
            setError('没写进去：' + String(result.error || '未知错误'));
            return;
          }
          setError('');
          patchServer(server.id, { enabled: enabled, pendingRestart: true });
        });
      };

      var onTool = function (server, tool, enabled) {
        setPendingTool(server.serverName + '/' + tool.name);
        postTool(server.serverName, tool.name, enabled).then(function (result) {
          setPendingTool('');
          if (result.ok !== true) {
            setError('没写进去：' + String(result.error || '未知错误'));
            return;
          }
          setError('');
          setReport(function (prev) {
            if (prev === null || !Array.isArray(prev.servers)) return prev;
            return Object.assign({}, prev, {
              servers: prev.servers.map(function (item) {
                if (item.serverName !== server.serverName) return item;
                var tools = (item.tools || []).map(function (each) {
                  return each.name === tool.name ? Object.assign({}, each, { enabled: enabled }) : each;
                });
                return Object.assign({}, item, {
                  tools: tools,
                  enabledTools: tools.filter(function (each) { return each.enabled !== false; }).length,
                });
              }),
            });
          });
        });
      };

      var onAdd = function (config) {
        setAdding(true);
        postAdd(config).then(function (result) {
          setAdding(false);
          if (result.ok !== true) {
            setError('添加失败：' + String(result.error || '未知错误'));
            return;
          }
          setError('');
          setDialog(false);
          load();
        });
      };

      var onRemove = function (server) {
        var label = server.serverName || server.id;
        if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
          if (!window.confirm('确定删除 MCP「' + label + '」？\n这会移除它的配置，重启 DSH 后生效。')) return;
        }
        setPendingId(server.id);
        postRemove(server.id).then(function (result) {
          setPendingId('');
          if (result.ok !== true) {
            setError('删除失败：' + String(result.error || '未知错误'));
            return;
          }
          setError('');
          load();
        });
      };

      var onReconnect = function (server) {
        setReconnecting(server.id);
        postReconnect(server.id).then(function (result) {
          setReconnecting('');
          if (result.ok !== true) {
            setError('重连失败：' + String(result.error || '未知错误'));
            return;
          }
          setError('');
          load();
        });
      };

      var canToggle = report !== null && report.canToggle === true;
      var servers = report && Array.isArray(report.servers) ? report.servers : [];
      var lowered = query.trim().toLowerCase();
      var filtered = servers.filter(function (server) {
        if (lowered === '') return true;
        if (String(server.serverName).toLowerCase().indexOf(lowered) >= 0) return true;
        if (String(server.id || '').toLowerCase().indexOf(lowered) >= 0) return true;
        return (server.tools || []).some(function (tool) {
          return String(tool.name).toLowerCase().indexOf(lowered) >= 0;
        });
      });
      var counts = report && report.counts ? report.counts : { servers: 0, tools: 0, enabled: 0 };
      var loadError = report && report.error ? String(report.error) : '';

      if (view === 'config') {
        return React.createElement(
          'div',
          { className: 'mq' },
          React.createElement(
            'div',
            { className: 'mq__top' },
            React.createElement(
              'div',
              { className: 'mq__titleblock' },
              React.createElement('h3', { className: 'mq__title' }, 'MCP 服务管理'),
              React.createElement('p', { className: 'mq__sub' }, '安装 MCP 服务，为 AI 扩展更多工具能力'),
            ),
            React.createElement(
              'button',
              { type: 'button', className: 'mq__x', 'aria-label': '关闭', onClick: function () { setView('list'); } },
              '\u2715',
            ),
          ),
          React.createElement(ConfigView, {
            onBack: function () { setView('list'); },
            onSaved: function () { load(); },
          }),
        );
      }

      return React.createElement(
        'div',
        { className: 'mq' },
        React.createElement(
          'div',
          { className: 'mq__top' },
          React.createElement(
            'div',
            { className: 'mq__titleblock' },
            React.createElement('h3', { className: 'mq__title' }, 'MCP 服务管理'),
            React.createElement('p', { className: 'mq__sub' }, '安装 MCP 服务，为 AI 扩展更多工具能力'),
          ),
          React.createElement(
            'button',
            { type: 'button', className: 'mq__btn', onClick: function () { setDialog(true); }, disabled: !canToggle },
            React.createElement('span', { 'aria-hidden': 'true' }, '+'),
            '添加 MCP',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'mq__iconbtn',
              title: '用配置文件添加 MCP',
              'aria-label': '用配置文件添加 MCP',
              disabled: !canToggle,
              onClick: function () { setView('config'); },
            },
            React.createElement(
              'svg',
              { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none', stroke: 'currentColor',
                strokeWidth: 1.5, 'aria-hidden': 'true', focusable: 'false' },
              React.createElement('path', { d: 'M5.6 2.6h4.8L13 5.2v8.2H3V2.6z', strokeLinejoin: 'round' }),
              React.createElement('path', { d: 'M5.6 2.6v2.6h4.8V2.6', strokeLinejoin: 'round' }),
            ),
          ),
        ),
        React.createElement(
          'div',
          { className: 'mq__tools' },
          React.createElement(
            'div',
            { className: 'mq__searchwrap' },
            React.createElement(
              'svg',
              { className: 'mq__searchicon', viewBox: '0 0 16 16', fill: 'none',
                stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': 'true', focusable: 'false' },
              React.createElement('circle', { cx: 7, cy: 7, r: 4.4 }),
              React.createElement('path', { d: 'M10.4 10.4 13.6 13.6', strokeLinecap: 'round' }),
            ),
            React.createElement('input', {
              className: 'mq__search', type: 'search', placeholder: '搜索 MCP',
              value: query, onChange: function (e) { setQuery(e.target.value); },
            }),
          ),
          React.createElement(
            'a',
            { className: 'mq__hublink', href: HUB_URL, target: '_blank', rel: 'noreferrer noopener' },
            React.createElement('span', { 'aria-hidden': 'true' }, '\u2197'),
            'MCP Hub',
          ),
        ),
        loadError !== '' ? React.createElement('p', { className: 'mq__err' }, loadError) : null,
        error !== '' ? React.createElement('p', { className: 'mq__err' }, error) : null,
        React.createElement(
          'div',
          { className: 'mq__sechead' },
          React.createElement('h4', null, '我的 MCP（' + counts.servers + '）'),
          React.createElement('span', { className: 'mq__grow' }),
          React.createElement('span', { className: 'mq__seccount' }, counts.enabled + ' 启用'),
        ),
        report === null
          ? React.createElement(
              'div',
              { className: 'mq__list' },
              React.createElement('div', { className: 'mq__skel' }),
              React.createElement('div', { className: 'mq__skel' }),
            )
          : null,
        report !== null && counts.servers === 0
          ? React.createElement('p', { className: 'mq__empty' }, '还没有 MCP 服务。点右上角「添加 MCP」开始。')
          : null,
        report !== null && counts.servers > 0 && filtered.length === 0
          ? React.createElement('p', { className: 'mq__empty' }, '没有匹配「' + query + '」的服务。')
          : null,
        filtered.length > 0
          ? React.createElement(
              'div',
              { className: 'mq__list' },
              filtered.map(function (server) {
                return React.createElement(ServerRow, {
                  key: server.id || server.serverName,
                  server: server,
                  canToggle: canToggle,
                  busy: pendingId === server.id,
                  busyTool: pendingTool,
                  onToggle: onToggle,
                  onTool: onTool,
                  onRemove: onRemove,
                  onReconnect: onReconnect,
                  reconnecting: reconnecting,
                });
              }),
            )
          : null,
        dialog
          ? React.createElement(AddDialog, { onClose: function () { setDialog(false); }, onSubmit: onAdd, busy: adding })
          : null,
      );
    }

    function SettingsNavIcon(props) {
      var size = props && typeof props.size === 'number' ? props.size : 16;
      return React.createElement(
        'svg',
        { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 16 16', width: size, height: size,
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, 'aria-hidden': 'true', focusable: 'false' },
        React.createElement('rect', { x: 1.4, y: 2.2, width: 5.2, height: 4.2, rx: 1.2 }),
        React.createElement('rect', { x: 9.4, y: 2.2, width: 5.2, height: 4.2, rx: 1.2 }),
        React.createElement('rect', { x: 1.4, y: 9.6, width: 5.2, height: 4.2, rx: 1.2 }),
        React.createElement('path', { d: 'M12 9.6v4.2M9.9 11.7h4.2' }),
      );
    }

    function registerSettingsSection(ctx) {
      try {
        ctx.slots.inject(SETTINGS_SLOT, function () {
          return ctx.slots.register(
            { name: SETTINGS_SLOT, id: SETTINGS_ENTRY_ID, order: SETTINGS_ORDER,
              label: function () { return 'MCP 服务'; } },
            function SettingsSection() { return React.createElement(McpViewerPage, null); },
          );
        });
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] 设置页注册失败：', error); } catch (ignored) {}
      }
    }

    function registerSettingsNavIcon(ctx) {
      try {
        ctx.slots.inject(SETTINGS_NAV_ICON_SLOT, function () {
          return ctx.slots.register(
            { name: SETTINGS_NAV_ICON_SLOT, id: SETTINGS_ENTRY_ID, order: SETTINGS_ORDER,
              label: function () { return 'MCP 服务'; } },
            SettingsNavIcon,
          );
        });
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] 图标注册失败：', error); } catch (ignored) {}
      }
    }

    /*
     * 侧边栏那一页。复用同一个 McpViewerPage，只是套一层给窄栏用的容器。
     * `main` 槽位是 keyed 的，key 与 sidebar.panellist 的 id 必须一致，
     * 侧边栏点行 -> 选中这个 keyed panel，这是宿主唯一的公开契约。
     */
    function McpPanelPage() {
      return React.createElement(
        'div',
        { className: 'mq mq__panel' },
        React.createElement(McpViewerPage, { surface: 'sidebar' }),
      );
    }

    /* 侧边栏导航行的小图标：同样的四个方块，尺寸跟随宿主给的 size。 */
    function PanelIcon(props) {
      var size = props && typeof props.size === 'number' ? props.size : 16;
      return SettingsNavIcon({ size: size });
    }

    /* 侧边栏是否出现由设置页的开关决定：模块级状态 + 订阅者，可即时装卸。 */
    var sidebarCtx = null;
    var sidebarDisposers = [];
    var sidebarListeners = [];
    var sidebarOn = false;

    function subscribeSidebar(fn) {
      sidebarListeners.push(fn);
      return function () {
        var at = sidebarListeners.indexOf(fn);
        if (at >= 0) sidebarListeners.splice(at, 1);
      };
    }

    function applySidebar(value, ctx) {
      if (ctx !== undefined && ctx !== null) sidebarCtx = ctx;
      sidebarOn = value === true;
      for (var i = 0; i < sidebarDisposers.length; i += 1) {
        try { sidebarDisposers[i](); } catch (ignored) {}
      }
      sidebarDisposers = [];
      if (sidebarOn && sidebarCtx !== null) sidebarDisposers = registerSidebarPanel(sidebarCtx);
      for (var j = 0; j < sidebarListeners.length; j += 1) {
        try { sidebarListeners[j](sidebarOn); } catch (ignored) {}
      }
      return sidebarOn;
    }

    /* 直接 register，不用 inject 包一层：inject 是惰性的，宿主只在槽位被渲染/用到时
       才真正登记，表现就是「开关打开后还得点一下别处，侧边栏才冒出来」。
       直接注册则开关一打开立即生效，disposer 也直接拿到。 */
    function registerSidebarPanel(ctx) {
      var disposers = [];
      try {
        disposers.push(ctx.slots.register(
          { name: MAIN_SLOT, key: PANEL_ID },
          function McpMainPanel() { return React.createElement(McpPanelPage, null); },
        ));
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] main 面板注册失败：', error); } catch (ignored) {}
        return disposers;
      }
      try {
        disposers.push(ctx.slots.register(
          { name: PANEL_LIST_SLOT, id: PANEL_ID, order: 30, label: function () { return 'MCP 服务'; } },
          PanelIcon,
        ));
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] sidebar.panellist 注册失败：', error); } catch (ignored) {}
      }
      return disposers;
    }

    /* 设置 → 插件 → 已安装列表里，本插件自己的配置卡：同一个开关。 */
    function PluginConfigCard() {
      var s = React.useState(sidebarOn);
      var on = s[0];
      var setOn = s[1];
      React.useEffect(function () { return subscribeSidebar(setOn); }, []);
      var toggle = function () {
        var wanted = !on;
        postPrefs(wanted).then(function (r) {
          if (r && r.ok === true) { applySidebar(wanted); setOn(wanted); }
        });
      };
      return React.createElement(
        'div',
        { className: 'mq__plugcfg' },
        React.createElement('span', { className: 'mq__sidelabel' }, '在左侧边栏显示 MCP 服务'),
        React.createElement('span', { className: 'mq__grow' }),
        React.createElement(Switch, {
          on: on,
          label: '放到侧边栏',
          title: '开启后左侧边栏出现「MCP 服务」入口',
          onClick: toggle,
        }),
      );
    }

    function registerPluginConfig(ctx) {
      try {
        ctx.slots.inject('plugins.bundle.config', (function (slotName, SlotComponent) {
          return function () {
            return ctx.slots.register(
              { name: slotName, key: PACKAGE_ID, label: function () { return 'MCP 服务'; } },
              SlotComponent,
            );
          };
        })('plugins.bundle.config', PluginConfigCard));
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] 插件配置卡注册失败：', error); } catch (ignored) {}
      }
    }

    function apply(ctx) {
      installStyles();
      registerSettingsSection(ctx);
      registerSettingsNavIcon(ctx);
      registerPluginConfig(ctx);
      sidebarCtx = ctx;
      try {
        fetchReport().then(function (r) {
          applySidebar(r && r.prefs ? r.prefs.sidebarPanel === true : false, ctx);
        });
      } catch (ignored) {}
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.__internals = {
      CSS: CSS, avatarColor: avatarColor, HUB_URL: HUB_URL,
      McpViewerPage: McpViewerPage, ServerRow: ServerRow, Switch: Switch,
      AddDialog: AddDialog, ConfigView: ConfigView, SettingsNavIcon: SettingsNavIcon,
      McpPanelPage: McpPanelPage, PanelIcon: PanelIcon, PANEL_ID: PANEL_ID,
      PluginConfigCard: PluginConfigCard, applySidebar: applySidebar, subscribeSidebar: subscribeSidebar,
      API_PREFS: API_PREFS, postPrefs: postPrefs, API_REMOVE: API_REMOVE, postRemove: postRemove, API_RECONNECT: API_RECONNECT, postReconnect: postReconnect,
      fetchReport: fetchReport, postToggle: postToggle, postTool: postTool, postAdd: postAdd,
      fetchConfig: fetchConfig, saveConfig: saveConfig,
    };
    return module.exports;
  },
});
