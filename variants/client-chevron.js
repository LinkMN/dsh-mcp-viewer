window.__ModuleLoader__.load({
  id: 'dsh-mcp-viewer',
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;

    var React = require('react');

    var PACKAGE_ID = 'dsh-mcp-viewer';
    var API_PATH = '/dsh-mcp-viewer/api';
    /* Settings -> left rail: a list slot, one page per registered entry. */
    var SETTINGS_SLOT = 'settings.section';
    var SETTINGS_ENTRY_ID = 'mcp-viewer-settings';
    var SETTINGS_ORDER = 63;
    var SETTINGS_NAV_ICON_SLOT = 'settings.section.icon';
    var STYLE_ID = PACKAGE_ID + '-styles';

    /* Only slots is injected: it is certainly provided, and a declaration for a
       service nobody provides would leave this plugin's fiber pending. */
    var inject = ['slots'];

    var CSS = [
      '.mcpv{display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.55;',
      'color:var(--dsw-alias-label-primary);padding:2px 0 8px}',
      '.mcpv h3{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.mcpv__head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
      '.mcpv__meta{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.mcpv__card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;',
      'padding:2px 14px;display:flex;flex-direction:column;',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.mcpv__card--flat{background:transparent}',
      /* The whole header is the disclosure control: a full-width button, so the
         click target is everything the eye reads as "this server". */
      '.mcpv__summary{display:flex;align-items:center;gap:8px;flex-wrap:wrap;',
      'width:100%;padding:10px 0;margin:0;font:inherit;font-size:13px;text-align:left;',
      'background:transparent;border:none;color:inherit;cursor:pointer;border-radius:8px}',
      '@media (hover:hover){.mcpv__summary:hover{color:var(--dsw-alias-brand-primary)}}',
      '.mcpv__summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.mcpv__chevron{width:12px;height:12px;flex:none;display:block;',
      'transition:transform .14s ease;transform:rotate(0deg);',
      'color:var(--dsw-alias-label-secondary)}',
      '.mcpv__chevron[data-open="1"]{transform:rotate(90deg)}',
      '@media (prefers-reduced-motion:reduce){.mcpv__chevron{transition:none}}',
      '.mcpv__dot{width:6px;height:6px;border-radius:999px;flex:none;',
      'background:var(--dsw-alias-state-idle-primary)}',
      '.mcpv__dot[data-on="1"]{background:var(--dsw-alias-state-success-primary);',
      'box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary) 22%,transparent)}',
      '.mcpv__name{font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
      '.mcpv__badge{font-size:11px;padding:1px 7px;border-radius:999px;',
      'border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}',
      '.mcpv__spacer{flex:1 1 auto}',
      '.mcpv__cmd{margin:0 0 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
      'font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}',
      '.mcpv__tools{display:flex;flex-direction:column;margin:0 0 7px;',
      'border-top:1px solid var(--dsw-alias-border-l1)}',
      /* One tool: a button too, so its full description and parameters are one
         click away instead of flooding the list. */
      '.mcpv__tool{display:flex;flex-direction:column;gap:2px;width:100%;padding:7px 0 7px 18px;',
      'margin:0;font:inherit;font-size:12px;text-align:left;background:transparent;',
      'border:none;border-bottom:1px solid var(--dsw-alias-border-l1);color:inherit;',
      'border-radius:6px;cursor:pointer}',
      '.mcpv__tool:last-child{border-bottom:none}',
      '@media (hover:hover){.mcpv__tool:hover{background:var(--dsw-alias-interactive-bg-hover)}}',
      '.mcpv__tool:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.mcpv__tool-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;',
      'font-weight:500;display:flex;align-items:center;gap:6px}',
      '.mcpv__tool-desc{font-size:11.5px;color:var(--dsw-alias-label-secondary);',
      'display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}',
      '.mcpv__tool[data-open="1"] .mcpv__tool-desc{-webkit-line-clamp:unset;display:block}',
      '.mcpv__params{margin:4px 0 2px;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px}',
      '.mcpv__param{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;',
      'padding:1px 6px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);',
      'color:var(--dsw-alias-label-secondary)}',
      '.mcpv__empty{margin:0 0 10px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.mcpv__error{margin:0;font-size:12px;color:var(--dsw-alias-state-error-primary)}',
      '.mcpv__btn{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 11px;',
      'font:inherit;font-size:12px;cursor:pointer;border-radius:7px;border:1px solid transparent;',
      'background:transparent;color:var(--dsw-alias-brand-primary);',
      'box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,transparent)}',
      '.mcpv__btn:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}',
      '.mcpv__btn:disabled{opacity:.55;cursor:progress}',
      '.mcpv__search{height:28px;padding:0 10px;font:inherit;font-size:12px;min-width:180px;',
      'border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:transparent;',
      'color:var(--dsw-alias-label-primary)}',
    ].join('');

    /* Inject the stylesheet once per client lifetime. The loader keeps the
       factory closure lazy, so this runs at materialization, never at load. */
    function installStyles() {
      try {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID) !== null) return;
        var element = document.createElement('style');
        element.id = STYLE_ID;
        element.textContent = CSS;
        document.head.appendChild(element);
      } catch (ignored) {
        /* styling is optional */
      }
    }

    /* Read the host report: one read-only GET. Any failure resolves to an
       error object so the panel can say what happened instead of rendering
       nothing. */
    function fetchReport() {
      return fetch(API_PATH, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        cache: 'no-store',
      }).then(function (response) {
        if (!response.ok) {
          return { error: 'HTTP ' + response.status + ' from ' + API_PATH };
        }
        return response.json();
      }).catch(function (error) {
        return { error: String((error && error.message) || error) };
      });
    }

    /* The rotated disclosure arrow. */
    function Chevron(props) {
      return React.createElement(
        'svg',
        {
          className: 'mcpv__chevron',
          'data-open': props.open ? '1' : '0',
          viewBox: '0 0 12 12',
          width: 12,
          height: 12,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        React.createElement('path', {
          d: 'M4.2 2.4 8 6l-3.8 3.6',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /* Parameter names from an MCP input schema, or an empty list when the tool
       takes none. Prefixed with the required marker so the shape is visible
       without opening a JSON viewer. */
    function paramsOf(tool) {
      var schema = tool && tool.parameters;
      if (schema === null || typeof schema !== 'object') return [];
      var properties = schema.properties;
      if (properties === null || typeof properties !== 'object') return [];
      var required = Array.isArray(schema.required) ? schema.required : [];
      var names = [];
      for (var key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key) === false) continue;
        names.push(required.indexOf(key) >= 0 ? key + '*' : key);
      }
      return names;
    }

    /* One tool row: name, one clipped line of description, and - on click - the
       full description plus its parameter list. */
    function ToolRow(props) {
      var tool = props.tool;
      var openState = React.useState(false);
      var open = openState[0];
      var setOpen = openState[1];
      var params = paramsOf(tool);
      var children = [
        React.createElement('span', { className: 'mcpv__tool-name', key: 'name' }, tool.name),
        React.createElement(
          'span',
          { className: 'mcpv__tool-desc', key: 'desc' },
          tool.description || 'No description',
        ),
      ];
      if (open && params.length > 0) {
        children.push(
          React.createElement(
            'ul',
            { className: 'mcpv__params', key: 'params' },
            params.map(function (name) {
              return React.createElement('li', { className: 'mcpv__param', key: name }, name);
            }),
          ),
        );
      }
      return React.createElement(
        'button',
        {
          type: 'button',
          className: 'mcpv__tool',
          'data-open': open ? '1' : '0',
          'aria-expanded': open ? 'true' : 'false',
          title: tool.publicName || tool.name,
          onClick: function () { setOpen(!open); },
        },
        children,
      );
    }

    /* One server card: the header is the whole disclosure control, and it starts
       collapsed - a server with eighteen tools should cost one line until it is
       actually wanted. */
    function ServerCard(props) {
      var server = props.server;
      var openState = React.useState(false);
      var open = openState[0];
      var setOpen = openState[1];
      var tools = Array.isArray(server.tools) ? server.tools : [];
      var label = tools.length === 1 ? '1 tool' : tools.length + ' tools';
      var header = React.createElement(
        'div',
        { className: 'mcpv__row' },
        React.createElement(Chevron, { open: open }),
        React.createElement('span', { className: 'mcpv__dot', 'data-on': server.enabled ? '1' : '0' }),
        React.createElement('span', { className: 'mcpv__name' }, server.serverName),
        React.createElement('span', { className: 'mcpv__badge' }, server.transport),
        server.enabled ? null : React.createElement('span', { className: 'mcpv__badge' }, 'disabled'),
        React.createElement('span', { className: 'mcpv__spacer' }),
        React.createElement('span', { className: 'mcpv__meta' }, label),
      );
      return React.createElement(
        'div',
        { className: 'mcpv__card' },
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'mcpv__summary',
            'aria-expanded': open ? 'true' : 'false',
            onClick: function () { setOpen(!open); },
          },
          header,
        ),
        open && server.target
          ? React.createElement('p', { className: 'mcpv__cmd' }, server.target)
          : null,
        open && server.id
          ? React.createElement('p', { className: 'mcpv__cmd' }, 'row: ' + server.id)
          : null,
        open && tools.length === 0
          ? React.createElement('p', { className: 'mcpv__empty' },
              server.enabled
                ? 'No tools registered. The bridge either has not connected yet, or the server published none.'
                : 'This row is disabled, so the bridge never connected.')
          : null,
        open && tools.length > 0
          ? React.createElement(
              'div',
              { className: 'mcpv__tools' },
              tools.map(function (tool) {
                return React.createElement(ToolRow, {
                  key: tool.publicName || tool.name,
                  tool: tool,
                });
              }),
            )
          : null,
      );
    }

    /* The whole page: counts, filter, refresh, one card per server, and any
       namespace with live tools but no configured row. */
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

      var load = React.useCallback(function () {
        setBusy(true);
        fetchReport().then(function (next) {
          setReport(next);
          setBusy(false);
        });
      }, []);

      React.useEffect(function () {
        load();
      }, [load]);

      var error = report && report.error ? String(report.error) : null;
      var servers = report && Array.isArray(report.servers) ? report.servers : [];
      var orphans = report && Array.isArray(report.orphanNamespaces) ? report.orphanNamespaces : [];
      var lowered = query.trim().toLowerCase();

      var filtered = servers.map(function (server) {
        if (lowered === '') return { server: server, tools: server.tools || [] };
        var tools = (server.tools || []).filter(function (tool) {
          return (String(tool.name) + ' ' + String(tool.description)).toLowerCase().indexOf(lowered) >= 0;
        });
        var byName = String(server.serverName).toLowerCase().indexOf(lowered) >= 0;
        if (tools.length === 0 && !byName) return null;
        return { server: server, tools: tools };
      }).filter(function (item) { return item !== null; });

      var counts = report && report.counts ? report.counts : { servers: 0, tools: 0 };

      return React.createElement(
        'div',
        { className: 'mcpv' },
        React.createElement(
          'div',
          { className: 'mcpv__head' },
          React.createElement('h3', null, 'MCP servers'),
          React.createElement(
            'p',
            { className: 'mcpv__meta' },
            report === null
              ? 'Loading...'
              : counts.servers + (counts.servers === 1 ? ' configured server, ' : ' configured servers, ') +
                counts.tools + (counts.tools === 1 ? ' registered tool' : ' registered tools'),
          ),
        ),
        React.createElement(
          'div',
          { className: 'mcpv__row' },
          React.createElement('input', {
            className: 'mcpv__search',
            type: 'search',
            placeholder: 'Filter servers and tools',
            value: query,
            onChange: function (event) { setQuery(event.target.value); },
          }),
          React.createElement(
            'button',
            { type: 'button', className: 'mcpv__btn', disabled: busy, onClick: load },
            busy ? 'Refreshing...' : 'Refresh',
          ),
        ),
        error !== null ? React.createElement('p', { className: 'mcpv__error' }, error) : null,
        report !== null && error === null && servers.length === 0
          ? React.createElement(
              'div',
              { className: 'mcpv__card mcpv__card--flat' },
              React.createElement('p', { className: 'mcpv__empty' },
                'No MCP server is mounted in this profile. Add a row that loads ',
                React.createElement('code', null, '@deepseek-ai/dsh-mcp-client'),
                ' to your cordis.patch.yml.'),
            )
          : null,
        filtered.map(function (item) {
          var server = item.server;
          return React.createElement(ServerCard, {
            key: (server.id || '') + ':' + server.serverName,
            server: Object.assign({}, server, { tools: item.tools }),
          });
        }),
        orphans.length > 0
          ? React.createElement(
              'div',
              { className: 'mcpv__card mcpv__card--flat' },
              React.createElement('h3', null, 'Live tools without a configured row'),
              React.createElement('p', { className: 'mcpv__meta' },
                'These namespaces hold registered tools, but the loader shows no dsh-mcp-client row for them.'),
              orphans.map(function (orphan) {
                return React.createElement(ServerCard, {
                  key: 'orphan:' + orphan.serverName,
                  server: {
                    serverName: orphan.serverName,
                    enabled: true,
                    transport: 'unowned',
                    target: '',
                    id: '',
                    tools: orphan.tools,
                  },
                });
              }),
            )
          : null,
      );
    }

    /* The rail glyph: three stacked connectors. */
    function SettingsNavIcon(props) {
      var size = props && typeof props.size === 'number' ? props.size : 16;
      return React.createElement(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        React.createElement('rect', { x: 1.5, y: 2.2, width: 5, height: 4, rx: 1 }),
        React.createElement('rect', { x: 9.5, y: 2.2, width: 5, height: 4, rx: 1 }),
        React.createElement('rect', { x: 1.5, y: 9.8, width: 5, height: 4, rx: 1 }),
        React.createElement('path', { d: 'M12 9.8v4' }),
        React.createElement('path', { d: 'M9.5 11.8h5' }),
      );
    }

    /* Settings -> left rail entry. The matching id in 'settings.section.icon'
       is what links the page to its glyph. */
    function registerSettingsSection(ctx) {
      try {
        ctx.slots.inject(SETTINGS_SLOT, function () {
          return ctx.slots.register(
            {
              name: SETTINGS_SLOT,
              id: SETTINGS_ENTRY_ID,
              order: SETTINGS_ORDER,
              label: function () { return 'MCP servers'; },
            },
            function SettingsSection() {
              return React.createElement(McpViewerPage, null);
            },
          );
        });
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] settings section registration failed:', error); } catch (ignored) {}
      }
    }

    /* The rail glyph, in its own slot and under the section's id. */
    function registerSettingsNavIcon(ctx) {
      try {
        ctx.slots.inject(SETTINGS_NAV_ICON_SLOT, function () {
          return ctx.slots.register(
            {
              name: SETTINGS_NAV_ICON_SLOT,
              id: SETTINGS_ENTRY_ID,
              order: SETTINGS_ORDER,
              label: function () { return 'MCP servers'; },
            },
            SettingsNavIcon,
          );
        });
      } catch (error) {
        try { console.error('[' + PACKAGE_ID + '] settings icon registration failed:', error); } catch (ignored) {}
      }
    }

    function apply(ctx) {
      installStyles();
      registerSettingsSection(ctx);
      registerSettingsNavIcon(ctx);
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.__internals = {
      CSS: CSS,
      API_PATH: API_PATH,
      McpViewerPage: McpViewerPage,
      ServerCard: ServerCard,
      ToolRow: ToolRow,
      Chevron: Chevron,
      paramsOf: paramsOf,
      SettingsNavIcon: SettingsNavIcon,
      fetchReport: fetchReport,
    };
    return module.exports;
  },
});
