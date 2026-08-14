// DSH Mobile Sidebar Drawer
// 一个 DeepSeek Harness Web GUI 的动态 Cordis 插件（Client half）。
// 此文件内容即 `code.client`（函数体），可原样交给 cordis_define 使用。
//
// 效果：竖屏（高 >= 宽）时，左侧栏完全收起为离屏抽屉；
//       点左上角汉堡按钮滑出，点遮罩或侧边栏顶部折叠按钮收回。

return {
  apply(ctx) {
    const slots = ctx.get('slots')
    const layout = ctx.get('layout')
    if (slots === undefined || layout === undefined) return

    styles.insert(`
.dsh-mobile-drawer-toggle { display: none; }
.dsh-mobile-drawer-backdrop { display: none; }

@media (orientation: portrait) {
  /* The frame root is the element whose direct child is the shell overlay layer. */
  div:has(> [data-shell-overlay]) {
    grid-template-columns: 0px minmax(0, 1fr) 0px !important;
  }
  /* The sidebar leaves grid flow; re-place center and details columns. */
  div:has(> [data-shell-overlay]) > div:nth-child(2) { grid-column: 2; }
  div:has(> [data-shell-overlay]) > div:nth-child(3) { grid-column: 3; }

  /* Sidebar column becomes an off-canvas overlay drawer. */
  div:has(> [data-shell-overlay]) > div:first-child {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 280px;
    max-width: 85vw;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform var(--ds-transition-duration-slow, 240ms) var(--ds-ease-in-out, ease);
    box-shadow: none;
  }
  /* Open state (frame drops data-sidebar-collapsed): slide the drawer in. */
  div:has(> [data-shell-overlay]):not([data-sidebar-collapsed]) > div:first-child {
    transform: translateX(0);
    box-shadow: 0 0 48px rgba(0, 0, 0, 0.4);
  }

  /* The drag handle is meaningless in portrait. */
  div:has(> [data-shell-overlay]) > [data-side='sidebar'] { display: none !important; }

  /* Floating hamburger button. */
  .dsh-mobile-drawer-toggle {
    position: absolute;
    top: 10px; left: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px; height: 40px;
    border-radius: 12px;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.14));
    background: var(--dsw-alias-bg-layer-1, #fff);
    color: var(--dsw-alias-label-primary, #181818);
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  }

  /* Backdrop scrim, shown only while the drawer is open. */
  div:has(> [data-shell-overlay]):not([data-sidebar-collapsed]) .dsh-mobile-drawer-backdrop {
    display: block;
    position: absolute;
    inset: 0;
    background: rgba(10, 14, 20, 0.45);
    cursor: pointer;
  }
}

@media (orientation: portrait) and (prefers-reduced-motion: reduce) {
  div:has(> [data-shell-overlay]) > div:first-child { transition: none; }
}
`)

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'mobile-drawer' },
      () => {
        const toggle = () => { layout.toggleSidebar() }
        return React.createElement(React.Fragment, null,
          React.createElement('div', {
            key: 'backdrop',
            className: 'dsh-mobile-drawer-backdrop',
            'aria-hidden': 'true',
            onClick: toggle,
          }),
          React.createElement('button', {
            key: 'toggle',
            type: 'button',
            className: 'dsh-mobile-drawer-toggle',
            'aria-label': 'Toggle sidebar',
            onClick: toggle,
          },
            React.createElement('svg', {
              width: 20, height: 20, viewBox: '0 0 20 20',
              fill: 'none', 'aria-hidden': 'true',
            },
              React.createElement('path', {
                d: 'M2 5h16M2 10h16M2 15h16',
                stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round',
              }),
            ),
          ),
        )
      },
    ))
  },
}
