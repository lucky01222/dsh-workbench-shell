import { createElement as h, Fragment, useSyncExternalStore } from 'react'
import { FishLogo, IconPanelLeftOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'

export const inject = ['slots', 'locale', 'layout']

export function apply(ctx) {
  // Native desktop titlebars have a different, zero-width sidebar contract.
  if (document.documentElement.dataset.platform === 'darwin' || document.documentElement.hasAttribute('data-windows-titlebar')) return
  const listeners = new Set()
  let collapsed = true
  const sidebarState = {
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot: () => collapsed,
  }
  ctx.effect(() => ctx.locale.register('workbenchShell', {
    zh: { conversations: '对话', expand: '展开对话列表', collapse: '收起对话列表' },
    en: { conversations: 'Conversations', expand: 'Expand conversations', collapse: 'Collapse conversations' },
  }))
  const t = ctx.locale.bind('workbenchShell')

  ctx.effect(() => {
    document.body.setAttribute('data-workbench-shell', '1.8.3')
    const frames = new Set(), titles = new Map()
    const sync = () => {
      const app = ctx.layout.panelInfo.getSnapshot().activePanelId !== null
      const page = app ? 'app' : 'conversation'
      if (document.body.dataset.workbenchPage !== page) document.body.dataset.workbenchPage = page
      const frame = document.querySelector('[data-slot="sidebar"]')?.closest('[style*="grid-template-columns"]')
      if (frame) {
        frames.add(frame)
        // rc.2 has no public sidebar width setter. Project only the first grid
        // track into CSS, retaining the native preferred width and right tracks.
        // Never change the native inline template or toggle layout on routing.
        const columns = frame.style.gridTemplateColumns.replace(/^\d+(?:\.\d+)?px(?=\s)/, '56px')
        if (frame.style.getPropertyValue('--workbench-app-columns') !== columns) frame.style.setProperty('--workbench-app-columns', columns)
        if (!frame.hasAttribute('data-workbench-frame')) frame.setAttribute('data-workbench-frame', '')
        const next = frame.hasAttribute('data-sidebar-collapsed')
        if (next !== collapsed) { collapsed = next; for (const listener of listeners) listener() }
      }
      // Native tooltips are disabled in the expanded sidebar. Keep the original
      // accessible names available on this always-compact app rail.
      for (const button of document.querySelectorAll('[data-slot="sidebar"] button[class*="_panelRow"]')) {
        const label = button.getAttribute('aria-label')
        if (!label || (!titles.has(button) && button.hasAttribute('title'))) continue
        titles.set(button, label)
        if (button.title !== label) button.title = label
      }
    }
    sync()
    const unsubscribe = ctx.layout.panelInfo.subscribe(sync)
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'data-sidebar-collapsed', 'aria-label'] })
    return () => {
      unsubscribe(); observer.disconnect(); listeners.clear()
      document.body.removeAttribute('data-workbench-page')
      document.body.removeAttribute('data-workbench-shell')
      for (const frame of frames) { frame.removeAttribute('data-workbench-frame'); frame.style.removeProperty('--workbench-app-columns') }
      for (const [button, title] of titles) if (button.title === title) button.removeAttribute('title')
    }
  })

  function ConversationEntry() {
    const { activePanelId } = useSyncExternalStore(ctx.layout.panelInfo.subscribe, ctx.layout.panelInfo.getSnapshot)
    const closed = useSyncExternalStore(sidebarState.subscribe, sidebarState.getSnapshot)
    return h(Fragment, null,
      h(Tooltip, { label: t('conversations'), side: 'right' },
        h('button', { className: 'wbConversationEntry', type: 'button', 'aria-label': t('conversations'), 'aria-current': activePanelId === null ? 'page' : undefined, onClick: () => ctx.layout.selectPanel(null) }, h(FishLogo, { size: 24 }))),
      activePanelId === null && !closed ? h('span', { className: 'wbConversationHeading' }, t('conversations')) : null,
    )
  }
  function ConversationToggle() {
    const closed = useSyncExternalStore(sidebarState.subscribe, sidebarState.getSnapshot)
    const label = t(closed ? 'expand' : 'collapse')
    return h(Tooltip, { label }, h('button', {
      type: 'button', className: 'wbConversationToggle', 'aria-label': label,
      'aria-expanded': !closed, onClick: () => ctx.layout.toggleSidebar(),
    }, h(IconPanelLeftOutlineRegular, { size: 16 })))
  }
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'workbench.conversation-entry' }, ConversationEntry))
  ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({ name: 'conversation.header.leading', priority: -100 }, ConversationToggle))
}
