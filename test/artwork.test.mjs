import test from 'node:test'
import assert from 'node:assert/strict'
import {artworkProjection,artworkMotion} from '../src/artwork-projection.mjs'

class Element {
  constructor(){this.attrs=new Map();this.children=[];this.classes=new Set();this.mounted=false;this.properties=new Map();this.style={getPropertyValue:k=>this.properties.get(k)||'',setProperty:(k,v)=>this.properties.set(k,v),removeProperty:k=>this.properties.delete(k)};this.classList={contains:k=>this.classes.has(k),add:k=>this.classes.add(k),remove:k=>this.classes.delete(k)}}
  get isConnected(){return this.parent?this.parent.isConnected:this.mounted}
  getAttribute(k){return this.attrs.get(k)??null}
  hasAttribute(k){return this.attrs.has(k)}
  setAttribute(k,v){this.attrs.set(k,v)}
  removeAttribute(k){this.attrs.delete(k)}
  append(node){node.parent=this;this.children.push(node)}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;this.mounted=false}
  contains(node){return node===this||this.children.some(child=>child.contains(node))}
  getBoundingClientRect(){return {left:0,top:0,width:200,height:100}}
}
function fixture(){
 const body=new Element();body.mounted=true
 const headline=new Element(),group=new Element(),title=new Element(),badge=new Element(),slot=new Element(),header=new Element(),consumer=new Element()
 body.append(headline);headline.append(group);headline.append(slot);group.append(title);group.append(badge);body.append(header);body.append(consumer)
 group.classList.add('native-class');consumer.setAttribute('data-workbench-artwork','corner');slot.closest=()=>headline;headline.querySelector=()=>group
 const input={value:'Keep this unsent draft'},eventHandlers=new Map();let observers=0,callback
 const document={body,createElement:()=>new Element(),addEventListener:(name,fn)=>eventHandlers.set(name,fn),removeEventListener:name=>eventHandlers.delete(name),querySelectorAll:s=>(s.includes('conversation.hero.brand.mark')?[slot]:s.includes('header')?[header]:consumer.hasAttribute('data-workbench-artwork')?[consumer]:[]).filter(node=>node.isConnected)}
 const Observer=class{constructor(fn){callback=fn}observe(){observers++}disconnect(){observers--}}
 return {document,Observer,group,title,badge,headline,header,consumer,input,eventHandlers,get observers(){return observers},trigger:()=>callback()}
}
test('artwork changes leave native children and unsent input intact; cleanup restores owned markers',()=>{
 const f=fixture();let active=true
 const projection=artworkProjection({...f,enabled:()=>active}),dispose=projection.start()
 const first=projection.getSnapshot();assert.equal(first.length,4);projection.refresh();assert.equal(projection.getSnapshot(),first)
 assert.equal(f.group.children[0],f.title);assert.equal(f.group.children[1],f.badge);assert.equal(f.input.value,'Keep this unsent draft');assert.equal(f.consumer.getAttribute('data-workbench-artwork-active'),'true')
 active=false;projection.refresh();assert.equal(projection.getSnapshot().length,1);assert.equal(f.consumer.hasAttribute('data-workbench-artwork-active'),false)
 active=true;projection.refresh();assert.equal(projection.getSnapshot().length,4);assert.equal(f.header.children.length,1)
 dispose();assert.equal(f.observers,0);assert.equal(projection.getSnapshot().length,0);assert.deepEqual(f.group.children,[f.title,f.badge]);assert.equal(f.title.hasAttribute('data-workbench-original-hero-copy'),false);assert.equal(f.group.classList.contains('native-class'),true);assert.equal(f.group.classList.contains('wbHeroTitleGroup'),false);assert.equal(f.header.children.length,0);assert.equal(f.consumer.hasAttribute('data-workbench-artwork-active'),false)
})
test('detached page targets and invalid outlet variants stop rendering',()=>{
 const f=fixture(),projection=artworkProjection({...f,enabled:()=>true}),dispose=projection.start()
 f.consumer.setAttribute('data-workbench-artwork','javascript:unsupported');projection.refresh();assert.equal(f.consumer.hasAttribute('data-workbench-artwork-active'),false);assert.equal(projection.getSnapshot().some(x=>x.node===f.consumer),false)
 f.header.remove();projection.refresh();assert.equal(projection.getSnapshot().some(x=>x.type==='plugin'),false);dispose()
})
test('queued observer work cannot recreate artwork after unload',async()=>{
 const f=fixture(),projection=artworkProjection({...f,enabled:()=>true}),dispose=projection.start();f.trigger();dispose();await Promise.resolve();assert.equal(projection.getSnapshot().length,0);assert.equal(f.header.children.length,0)
})
test('removing a consumer outlet attribute releases its reserved display region',()=>{
 const f=fixture(),projection=artworkProjection({...f,enabled:()=>true}),dispose=projection.start();f.consumer.removeAttribute('data-workbench-artwork');projection.refresh();assert.equal(f.consumer.hasAttribute('data-workbench-artwork-active'),false);assert.equal(projection.getSnapshot().some(x=>x.node===f.consumer),false);dispose()
})
test('decorative motion respects preferences and restores existing inline values on cleanup',()=>{
 const f=fixture(),surface=new Element(),target=new Element();surface.append(target);target.closest=()=>surface;surface.style.setProperty('--figure-x','1px')
 const events=[new Map(),new Map()],media={fine:{matches:true,addEventListener:(k,fn)=>events[0].set(k,fn),removeEventListener:k=>events[0].delete(k)},reduced:{matches:false,addEventListener:(k,fn)=>events[1].set(k,fn),removeEventListener:k=>events[1].delete(k)}}
 let preference={scene:'manga',reduceMotion:false};const motion=artworkMotion(f.document,()=>preference,media)
 f.eventHandlers.get('pointermove')({target,clientX:200,clientY:100});assert.equal(surface.style.getPropertyValue('--figure-x'),'4px')
 motion.reset();assert.equal(surface.style.getPropertyValue('--figure-x'),'1px');preference={scene:'manga',reduceMotion:true};f.eventHandlers.get('pointermove')({target,clientX:200,clientY:100});assert.equal(surface.style.getPropertyValue('--figure-x'),'1px')
 motion.dispose();assert.equal(f.eventHandlers.size,0);assert.equal(events[0].size+events[1].size,0);assert.equal(surface.style.getPropertyValue('--figure-x'),'1px');assert.equal(surface.style.getPropertyValue('--foil-x'),'')
})
