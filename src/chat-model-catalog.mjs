import { symbols } from '@deepseek-ai/cordis'

// rc.2's chat catalog has no output modality or purpose field. Keep ordinary
// language-model routes, including vision input, and exclude explicit dedicated
// protocol/media identifiers. Do not infer output type from inputModalities.
const dedicated = /(?:^|[\s/_.:-])(?:embeddings?|embed|rerank(?:er)?)(?=$|[\s/_.:-]|\d)/i
const media = /(?:^|[\s/_.:-])(?:image|imagegen|imagen|video|flux|veo|sora|kling|wan\d*|seedream|seedance|vidu(?:q\d+)?|pixverse|paiwo|happyhorse|recraft|midjourney|dall-e|stable-diffusion|sdxl|grok-imagine|minimax[-_](?:hailuo|h3))(?=$|[\s/_.:-]|\d)/i
const dedicatedLabel = /文本向量|向量模型|嵌入模型|重排|图片生成|图像生成|生图|视频生成|生视频/

export function isChatModel(model) {
  if (!model || typeof model.id !== 'string' || typeof model.name !== 'string') return false
  return !dedicated.test(model.id) && !dedicated.test(model.name)
    && !media.test(model.id) && !dedicatedLabel.test(model.name)
}

/** Project only the chat menu and /model catalog; the LLM registry stays whole. */
export function chatModelCatalog(catalog) {
  const groups = catalog.groups.map(group => ({ ...group, models: group.models.filter(isChatModel) }))
    .filter(group => group.models.length > 0)
  return { ...catalog, groups, routableProviders: groups.map(group => group.id) }
}

/** rc.2 adapter over the public SessionController method, owned by this plugin. */
export function installChatModelCatalog(view) {
  const controller = view[symbols.original] ?? view
  const own = Object.getOwnPropertyDescriptor(controller, 'modelCatalog')
  let holder = controller, descriptor = own
  while (!descriptor && (holder = Object.getPrototypeOf(holder))) {
    descriptor = Object.getOwnPropertyDescriptor(holder, 'modelCatalog')
  }
  if (typeof descriptor?.value !== 'function') throw new Error('Unsupported session model catalog contract')
  const previous = descriptor.value
  let active = true
  async function modelCatalog(...args) {
    const catalog = await Reflect.apply(previous, this, args)
    return active ? chatModelCatalog(catalog) : catalog
  }
  Object.defineProperty(controller, 'modelCatalog', { configurable: true, enumerable: own?.enumerable ?? false, writable: true, value: modelCatalog })
  return () => {
    active = false
    // Preserve a later adapter. Its captured wrapper becomes passthrough.
    if (Object.getOwnPropertyDescriptor(controller, 'modelCatalog')?.value !== modelCatalog) return
    if (own) Object.defineProperty(controller, 'modelCatalog', own)
    else delete controller.modelCatalog
  }
}
