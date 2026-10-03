import { useState, useSyncExternalStore } from 'react'
import { FishLogo, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import capsule from './assets/aptx-capsule.svg'
import { appearanceState } from './appearance-state.mjs'
import { artworkProjection, artworkMotion } from './artwork-projection.mjs'
import { ThemeArtwork, ThemePortals } from './theme-artwork'
import './appearance.css'

/** Native General/Appearance remains the only owner of persisted preferences. */
export function installAppearance(ctx) {
  const state=appearanceState(ctx.configForms.get('workbench-shell'))
  ctx.effect(()=>()=>state.dispose())
  ctx.effect(()=>ctx.locale.register('workbenchAppearance',{
    zh:{brandTitle:'比护的 AI 工作台',themePicker:'主题素材',manga:'小哀 · 分层漫画',none:'无装饰',brandIcon:'工作台标志',capsule:'APTX 胶囊',native:'默认图标',reduceMotion:'减少动态效果',strength:'展示强度',soft:'轻柔',clear:'清晰',vivid:'鲜明',loading:'正在加载外观设置…',unavailable:'外观设置暂不可用，请重新连接。',temporary:'当前浏览器的外观设置仅在本次连接中生效。',failed:'外观设置保存失败，请重试。'},
    en:{brandTitle:'Bihu AI Workbench',themePicker:'Theme artwork',manga:'Haibara · Layered manga',none:'No artwork',brandIcon:'Workbench icon',capsule:'APTX capsule',native:'Default icon',reduceMotion:'Reduce motion',strength:'Artwork intensity',soft:'Soft',clear:'Clear',vivid:'Vivid',loading:'Loading appearance settings…',unavailable:'Appearance settings are unavailable. Reconnect to try again.',temporary:'These appearance settings last only for this browser connection.',failed:'Appearance settings could not be saved. Try again.'},
  }))
  const t=ctx.locale.bind('workbenchAppearance')
  ctx.effect(()=>{
    const names=['data-dsh-theme','data-dsh-theme-scene','data-dsh-theme-strength','data-dsh-reduce-motion']
    const previous=names.map(name=>document.body.getAttribute(name))
    const sync=()=>{const value=state.getSnapshot().value;document.body.setAttribute('data-dsh-theme','haibara');document.body.setAttribute('data-dsh-theme-scene',value.scene);document.body.setAttribute('data-dsh-theme-strength',value.strength);document.body.setAttribute('data-dsh-reduce-motion',String(value.reduceMotion))}
    sync();const off=state.subscribe(sync)
    return()=>{off();names.forEach((name,i)=>previous[i]===null?document.body.removeAttribute(name):document.body.setAttribute(name,previous[i]))}
  })
  const projection=artworkProjection({document,Observer:MutationObserver,enabled:()=>state.getSnapshot().value.scene!=='none'})
  ctx.effect(()=>{const dispose=projection.start(),off=state.subscribe(projection.refresh);return()=>{off();dispose()}})
  ctx.effect(()=>{
    const motion=artworkMotion(document,()=>state.getSnapshot().value,{reduced:window.matchMedia('(prefers-reduced-motion: reduce)'),fine:window.matchMedia('(hover:hover) and (pointer:fine)')})
    const off=state.subscribe(motion.reset)
    return()=>{off();motion.dispose()}
  })
  function Mark({size=24,className=''}) {
    const {value}=useSyncExternalStore(state.subscribe,state.getSnapshot)
    return value.icon==='native'?<FishLogo size={size} className={className}/>:<img className={`wbCapsuleMark ${className}`} src={capsule} width={size} height={size} alt=""/>
  }
  function Portals(){return <ThemePortals projection={projection} title={t('brandTitle')}/>}
  function Settings() {
    const snapshot=useSyncExternalStore(state.subscribe,state.getSnapshot),[pending,setPending]=useState(false),[error,setError]=useState(false)
    const {value}=snapshot,disabled=pending||(snapshot.mode==='host'&&(snapshot.status!=='ready'||!snapshot.writable))
    async function choose(field,next){setPending(true);setError(false);try{await state.save(field,next)}catch{setError(true)}finally{setPending(false)}}
    return <section className="wbAppearance" aria-label={t('themePicker')}>
      <div className="wbAppearanceRow"><span>{t('themePicker')}</span><fieldset disabled={disabled} className="wbThemeChoices"><legend className="wbVisuallyHidden">{t('themePicker')}</legend><button type="button" aria-pressed={value.scene==='manga'} onClick={()=>choose('scene','manga')}><span className="wbThemeChoiceArt"><ThemeArtwork variant="corner"/></span>{t('manga')}</button><button type="button" aria-pressed={value.scene==='none'} onClick={()=>choose('scene','none')}>{t('none')}</button></fieldset></div>
      {value.scene!=='none'&&<div className="wbAppearanceRow"><span>{t('strength')}</span><fieldset className="wbStrength" disabled={disabled}><legend className="wbVisuallyHidden">{t('strength')}</legend>{['soft','clear','vivid'].map(item=><button type="button" key={item} aria-pressed={value.strength===item} onClick={()=>choose('strength',item)}>{t(item)}</button>)}</fieldset></div>}
      <div className="wbAppearanceRow"><span>{t('brandIcon')}</span><fieldset className="wbIconOptions" disabled={disabled}><legend className="wbVisuallyHidden">{t('brandIcon')}</legend><button type="button" aria-pressed={value.icon==='aptx'} onClick={()=>choose('icon','aptx')}><img className="wbCapsuleMark" src={capsule} width={24} height={24} alt=""/>{t('capsule')}</button><button type="button" aria-pressed={value.icon==='native'} onClick={()=>choose('icon','native')}><FishLogo size={24}/>{t('native')}</button></fieldset></div>
      <div className="wbAppearanceRow"><span>{t('reduceMotion')}</span><Switch checked={value.reduceMotion} onChange={next=>{void choose('reduceMotion',next)}} label={t('reduceMotion')} disabled={disabled}/></div>
      {snapshot.mode==='memory'&&<p className="wbAppearanceHint">{t('temporary')}</p>}
      {snapshot.mode==='host'&&snapshot.status!=='ready'&&<p role="status" className="wbAppearanceHint">{t(snapshot.status==='loading'?'loading':'unavailable')}</p>}
      {error&&<p className="wbAppearanceError" role="alert">{t('failed')}</p>}
    </section>
  }
  ctx.slots.inject('settings.general.item',()=>ctx.slots.register({name:'settings.general.item',id:'workbench-appearance',order:10.1,locale:'workbenchAppearance'},Settings))
  ctx.slots.inject('conversation.hero.brand.mark',()=>ctx.slots.register({name:'conversation.hero.brand.mark',priority:-100,locale:'workbenchAppearance'},Mark))
  return {Mark,Portals}
}
