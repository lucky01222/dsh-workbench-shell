import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import {readFileSync} from 'node:fs'

function harness() {
 const attributes=new Map(), styles=new Map(), callbacks=new Set(), registrations=new Map(), cleanups=[]
 const frameAttrs=new Map()
 const frame={style:{gridTemplateColumns:'337px minmax(320px, 1fr) minmax(0px, 410px)',getPropertyValue:k=>styles.get(k)||'',setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)},hasAttribute:k=>frameAttrs.has(k),setAttribute:(k,v)=>frameAttrs.set(k,v),removeAttribute:k=>frameAttrs.delete(k)}
 let observer,plugin,selected={activePanelId:null},toggles=0
 const body={dataset:new Proxy({}, {get:(_,k)=>attributes.get(k),set:(_,k,v)=>{attributes.set(k,v);return true}}),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)}
 const document={documentElement:{dataset:{},hasAttribute:()=>false},body,head:{append:()=>{}},createElement:()=>({setAttribute(){},remove(){}}),querySelector:()=>({closest:()=>frame}),querySelectorAll:()=>[]}
 const react={createElement:(type,props,...children)=>({type,props,children}),Fragment:'fragment',useSyncExternalStore:(_,get)=>get()}
 const sandbox={document,MutationObserver:class{constructor(fn){observer=fn}observe(){}disconnect(){observer=null}},window:{__ModuleLoader__:{load:entry=>{plugin=entry.factory(id=>id==='react'?react:{FishLogo:'fish',IconPanelLeftOutlineRegular:'panel',Tooltip:'tooltip'})}}}}
 vm.runInNewContext(readFileSync('dist/client.js','utf8'),sandbox)
 const ctx={effect:fn=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup)},locale:{register:()=>()=>{},bind:()=>key=>key},layout:{panelInfo:{getSnapshot:()=>selected,subscribe:fn=>{callbacks.add(fn);return()=>callbacks.delete(fn)}},selectPanel:id=>{selected={activePanelId:id};for(const fn of callbacks)fn()},toggleSidebar:()=>toggles++},slots:{inject:(_,fn)=>fn(),register:(options,component)=>{registrations.set(options.name,component)}}}
 plugin.apply(ctx)
 return {frame,styles,attributes,registrations,ctx,get toggles(){return toggles},get observers(){return observer},callbacks,dispose:()=>{for(const fn of cleanups.reverse())fn()}}
}

test('plugin routing removes only sidebar track without resetting native widths',()=>{
 const h=harness();h.ctx.layout.selectPanel('workbench-agent-studio')
 assert.equal(h.attributes.get('workbenchPage'),'app')
 assert.equal(h.styles.get('--workbench-app-columns'),'56px minmax(320px, 1fr) minmax(0px, 410px)')
 assert.equal(h.frame.style.gridTemplateColumns,'337px minmax(320px, 1fr) minmax(0px, 410px)')
 h.ctx.layout.selectPanel(null);assert.equal(h.attributes.get('workbenchPage'),'conversation');assert.equal(h.toggles,0)
 h.dispose()
})
test('right-panel geometry refresh keeps the original sidebar preference',()=>{
 const h=harness();h.ctx.layout.selectPanel('plugins')
 h.frame.style.gridTemplateColumns='337px minmax(0px, 1fr) minmax(0px, 0px)';h.observers()
 assert.equal(h.styles.get('--workbench-app-columns'),'56px minmax(0px, 1fr) minmax(0px, 0px)')
 h.dispose()
})
test('whale returns to conversation while header button alone toggles its list',()=>{
 const h=harness();h.ctx.layout.selectPanel('plugins')
 const rail=h.registrations.get('shell.overlay')()
 rail.children[0].children[0].props.onClick()
 assert.equal(h.ctx.layout.panelInfo.getSnapshot().activePanelId,null);assert.equal(h.toggles,0)
 h.registrations.get('conversation.header.leading')().children[0].props.onClick();assert.equal(h.toggles,1)
 h.dispose()
})
test('unload releases observers, subscription, presentation markers and projection',()=>{
 const h=harness();h.ctx.layout.selectPanel('plugins');h.dispose()
 assert.equal(h.callbacks.size,0);assert.equal(h.observers,null);assert.equal(h.styles.size,0)
 assert.equal(h.frame.hasAttribute('data-workbench-frame'),false)
 assert.equal(h.attributes.has('data-workbench-shell'),false)
 assert.equal(h.frame.style.gridTemplateColumns,'337px minmax(320px, 1fr) minmax(0px, 410px)')
})
