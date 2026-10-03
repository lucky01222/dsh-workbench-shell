import z from '@deepseek-ai/schemastery'
export const Config = z.object({
  scene: z.union(['none', 'manga', 'glasses', ...Array.from({ length: 9 }, (_, index) => `scene-${index + 2}`)]).default('manga').volatile(),
  strength: z.union(['soft', 'clear', 'vivid']).default('clear').volatile(),
  icon: z.union(['native', 'aptx', '03', '05', '08', '16']).default('aptx').volatile(),
  reduceMotion: z.boolean().default(false).volatile(),
})
export function apply(ctx) {
  ctx.inject(['settings'], child => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
}
