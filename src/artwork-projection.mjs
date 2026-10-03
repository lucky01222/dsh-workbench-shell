const variants=new Set(['cutout','corner','silver-calm','silver-sleepy','silver-cheerful','cinema','drawing','silver-cinema'])
/**
 * rc.2 exposes the hero mark slot, but no page-art slot. Adapt only its verified
 * hero/title and PluginManagerPage header, plus optional consumer-owned outlets.
 * React portals own the content. This adapter never replaces native children.
 */
export function artworkProjection({document,Observer,enabled}) {
  const targets=new Map(),created=new Set(),classes=new Map(),attributes=new Map(),listeners=new Set()
  const request=typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>{Promise.resolve().then(fn);return 0}
  const cancel=typeof cancelAnimationFrame==='function'?cancelAnimationFrame:()=>{}
  let snapshot=[],observer,frame=null,disposed=false,sequence=0
  function attribute(node,name,value) {
    let saved=attributes.get(node)
    if(!saved){saved=new Map();attributes.set(node,saved)}
    if(!saved.has(name))saved.set(name,node.getAttribute(name))
    if(value===null)node.removeAttribute(name);else if(node.getAttribute(name)!==value)node.setAttribute(name,value)
  }
  function mark(node,name) {
    if(node.classList.contains(name))return
    node.classList.add(name)
    let saved=classes.get(node);if(!saved){saved=new Set();classes.set(node,saved)};saved.add(name)
  }
  function own(parent,key,type,variant) {
    let entry=targets.get(parent)?.get(key)
    if(!entry){const node=document.createElement('span');node.className=key;node.setAttribute('data-workbench-artwork-owner','shell');if(type!=='title')node.setAttribute('aria-hidden','true');parent.append(node);created.add(node);entry={id:`wb-art-${++sequence}`,node,type,variant};let map=targets.get(parent);if(!map){map=new Map();targets.set(parent,map)};map.set(key,entry)}
    return entry
  }
  function publish(next) {
    if(snapshot.length===next.length&&snapshot.every((entry,i)=>entry===next[i]))return
    snapshot=next;for(const listener of listeners)listener()
  }
  function refresh() {
    if(disposed)return
    const next=[],active=enabled()
    for(const slot of document.querySelectorAll('[data-slot="conversation.hero.brand.mark"]')) {
      const headline=slot.closest('[class*="_headline"]'),group=headline?.querySelector('[class*="_titleGroup"]')
      if(!headline||!group)continue
      mark(group,'wbHeroTitleGroup')
      for(const child of group.children)if(!child.hasAttribute('data-workbench-artwork-owner'))attribute(child,'data-workbench-original-hero-copy','')
      next.push(own(group,'wbHeroTitle','title'))
      mark(headline,'wbHomeHeading');attribute(headline,'data-workbench-art-motion','')
      if(active)next.push(own(headline,'wbHomeArtwork','home','cutout'))
    }
    for(const header of document.querySelectorAll('[data-slot="main"] > [class*="_page"] > header[class*="_pageHead"]')) {
      mark(header,'wbPluginHeading');attribute(header,'data-workbench-art-motion','')
      if(active)next.push(own(header,'wbPluginArtwork','plugin'))
    }
    for(const node of document.querySelectorAll('[data-workbench-artwork]')) {
      const variant=node.getAttribute('data-workbench-artwork')
      if(!variants.has(variant)){if(attributes.has(node))attribute(node,'data-workbench-artwork-active',null);continue}
      attribute(node,'data-workbench-artwork-active',active?'true':null)
      let entry=targets.get(node)?.get('consumer')
      if(active){if(!entry){entry={id:`wb-art-${++sequence}`,node,type:'art',variant};let map=targets.get(node);if(!map){map=new Map();targets.set(node,map)};map.set('consumer',entry)}else if(entry.variant!==variant){entry={...entry,variant};targets.get(node).set('consumer',entry)}next.push(entry)}
    }
    const live=new Set(next)
    for(const [parent,map] of targets) {
      for(const [key,entry] of map)if(!parent.isConnected||!live.has(entry)){if(key==='consumer')attribute(parent,'data-workbench-artwork-active',null);if(created.has(entry.node)){entry.node.remove();created.delete(entry.node)}map.delete(key)}
      if(!parent.isConnected||!map.size)targets.delete(parent)
    }
    // Detached host nodes must not accumulate after session or application changes.
    for(const map of [classes,attributes])for(const node of map.keys())if(!node.isConnected)map.delete(node)
    publish(next)
  }
  return {
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},
    refresh,
    start(){refresh();observer=new Observer(()=>{if(frame!==null||disposed)return;frame=request(()=>{frame=null;refresh()})});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-workbench-artwork']});return()=>{
      disposed=true;observer.disconnect();if(frame!==null)cancel(frame);publish([])
      for(const node of created)node.remove()
      for(const [node,names] of classes)for(const name of names)node.classList.remove(name)
      for(const [node,saved] of attributes)for(const [name,value] of saved)value===null?node.removeAttribute(name):node.setAttribute(name,value)
      created.clear();targets.clear();classes.clear();attributes.clear();listeners.clear()
    }},
  }
}

/** Decorative motion only; all listeners and inline properties have a disposer. */
export function artworkMotion(document,preferences,media) {
  const moved=new Map(),keys=['--foil-x','--figure-x','--figure-y']
  function reset(){for(const [node,saved] of moved)for(const key of keys){const value=saved[key];value?node.style.setProperty(key,value):node.style.removeProperty(key)}moved.clear()}
  function move(event) {
    if(preferences().reduceMotion||media.reduced.matches||!media.fine.matches)return
    const surface=event.target?.closest?.('[data-workbench-art-motion]')
    if(!surface||preferences().scene==='none')return
    if(!moved.has(surface))moved.set(surface,Object.fromEntries(keys.map(key=>[key,surface.style.getPropertyValue(key)])))
    const r=surface.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),y=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1))
    surface.style.setProperty('--foil-x',(52+x*20)+'%');surface.style.setProperty('--figure-x',(x*4)+'px');surface.style.setProperty('--figure-y',(y*2)+'px')
  }
  function leave(event){const surface=event.target?.closest?.('[data-workbench-art-motion]');if(surface&&!surface.contains(event.relatedTarget))reset()}
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerout',leave,{passive:true})
  media.reduced.addEventListener('change',reset);media.fine.addEventListener('change',reset)
  return {reset,dispose(){reset();document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',leave);media.reduced.removeEventListener('change',reset);media.fine.removeEventListener('change',reset)}}
}
