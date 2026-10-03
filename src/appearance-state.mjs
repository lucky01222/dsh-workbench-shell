export const DEFAULT_APPEARANCE = Object.freeze({ scene: 'manga', strength: 'clear', icon: 'aptx', reduceMotion: false })
const choices = {
  scene: ['none', 'manga'],
  strength: ['soft', 'clear', 'vivid'],
  icon: ['native', 'aptx'],
  reduceMotion: [false, true],
}
/** Read compatibility only: old wallpaper/portrait choices become the approved theme. */
export function normalizeAppearance(value = {}) {
  return {scene:value.scene==='none'?'none':'manga',strength:choices.strength.includes(value.strength)?value.strength:'clear',icon:value.icon==='native'?'native':'aptx',reduceMotion:value.reduceMotion===true}
}
/** One settings form owns persistent preferences; remote browsers remain temporary. */
export function appearanceState(form) {
  let temporary = { ...DEFAULT_APPEARANCE }, disposed = false
  const listeners = new Set()
  const project = () => {
    const value = form.getSnapshot()
    return { ...value, value: value.mode === 'memory' ? temporary : normalizeAppearance(value.value ?? DEFAULT_APPEARANCE) }
  }
  let snapshot = project()
  const update = () => { snapshot = project(); for (const listener of listeners) listener() }
  const unsubscribe = form.subscribe(update)
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
    async save(field, value) {
      if (disposed) throw new Error('Appearance settings have been disposed')
      if (!choices[field]?.includes(value)) throw new Error('Invalid appearance selection')
      if (snapshot.mode === 'memory') { temporary = { ...temporary, [field]: value }; update(); return }
      if (snapshot.status !== 'ready' || !snapshot.writable) throw new Error('Appearance settings are unavailable')
      if (!await form.set(field, value)) throw new Error('Appearance settings were not saved')
    },
    dispose() { disposed = true; unsubscribe(); listeners.clear() },
  }
}
