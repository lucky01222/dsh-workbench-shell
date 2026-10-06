import test from 'node:test'
import assert from 'node:assert/strict'
import { Context, Service } from '@deepseek-ai/cordis'
import { readFile } from 'node:fs/promises'
import { chatModelCatalog, installChatModelCatalog, isChatModel } from '../src/chat-model-catalog.mjs'

const entry=(id,name=id)=>({id,name})
const catalog=()=>({default:{provider:'deepseek-official',model:'deepseek-v4-pro',reasoningEffort:'high'},routableProviders:['deepseek-official','dmxapi','images'],groups:[
 {id:'deepseek-official',name:'DeepSeek',models:[{...entry('deepseek-v4-pro'),reasoning:{defaultEffort:'high',efforts:[{id:'high',name:'High'}]}},entry('deepseek-v41-flash')]},
 {id:'dmxapi',name:'DMXAPI',models:[entry('qwen3.7-text-embedding','Qwen3.7 文本向量'),entry('jina-reranker-v3.5'),entry('qwen3.8-flash'),entry('gpt-6-luna'),entry('gemini-3.1-flash-image'),entry('gemini-3.1-flash-lite-image'),entry('gemini-3-pro-image')]},
 {id:'images',name:'Images',models:[entry('flux-2-pro'),entry('sora-2'),entry('doubao-seedance-2-0-mini-260615')]},
],failures:[{id:'offline',name:'Offline',message:'provider temporarily unavailable'}]})

test('chat picker retains text and vision chat routes while excluding dedicated protocols and generation routes',()=>{
 const raw=catalog(),before=structuredClone(raw),filtered=chatModelCatalog(raw)
 assert.deepEqual(filtered.groups.flatMap(g=>g.models.map(m=>m.id)),['deepseek-v4-pro','deepseek-v41-flash','qwen3.8-flash','gpt-6-luna'])
 assert.deepEqual(filtered.routableProviders,['deepseek-official','dmxapi']);assert.deepEqual(filtered.default,raw.default);assert.deepEqual(filtered.failures,raw.failures)
 assert.equal(filtered.groups[0].models[0].reasoning,raw.groups[0].models[0].reasoning);assert.deepEqual(raw,before)
 for(const id of ['claude-sonnet-4-5','qwen3-vl-235b','gemini-3.1-pro','gpt-4o','MiniMax-M2.5'])assert.equal(isChatModel(entry(id)),true)
 assert.equal(isChatModel(entry('custom-model','自定义重排')),false)
 assert.equal(isChatModel(entry('custom-vision','Vision image input')),true)
})

test('all 57 configured media routes and both dedicated retrieval routes stay out of chat',async()=>{
 const ids=JSON.parse(await readFile(new URL('./fixtures/dedicated-models.json',import.meta.url),'utf8'))
 assert.equal(ids.length,59)
 assert.deepEqual(ids.filter(id=>isChatModel(entry(id))),[])
})

test('catalog refresh reads current data, preserves isolated provider errors and does not invent a fallback default',async()=>{
 let current=catalog();const controller={async modelCatalog(){return current}};const restore=installChatModelCatalog(controller)
 try {assert.equal((await controller.modelCatalog()).groups.length,2);current={...catalog(),default:{provider:'dmxapi',model:'gemini-3-pro-image'},groups:[{id:'dmxapi',name:'DMXAPI',models:[entry('gemini-3-pro-image')]}]};const empty=await controller.modelCatalog();assert.deepEqual(empty.groups,[]);assert.deepEqual(empty.routableProviders,[]);assert.deepEqual(empty.default,current.default);assert.deepEqual(empty.failures,current.failures)}finally{restore()}
})

test('rc2 Cordis service keeps accessing context and unload restores inherited method without touching full registry',async()=>{
 const ctx=new Context();const full=catalog();ctx.provide('llm',{listModels:()=>full.groups.flatMap(g=>g.models)})
 class Controller extends Service {constructor(ctx){super(ctx,'sessionController')}async modelCatalog(){assert.equal(this.ctx.marker,'rpc');return full}}
 const controller=new Controller(ctx);const child=ctx.extend({marker:'adapter'});const release=installChatModelCatalog(child.sessionController)
 assert.equal(Object.hasOwn(controller,'modelCatalog'),true)
 const remote=ctx.extend({marker:'rpc'}).sessionController;const filtered=await remote.modelCatalog();assert.equal(filtered.groups[1].models.length,2);assert.equal(ctx.llm.listModels().length,12)
 release();assert.equal(Object.hasOwn(controller,'modelCatalog'),false);assert.equal((await remote.modelCatalog()).groups[1].models.length,7)
 const again=installChatModelCatalog(child.sessionController);assert.equal((await remote.modelCatalog()).groups[1].models.length,2);again()
})

test('unload retains a later adapter and its captured old wrapper becomes pass-through',async()=>{
 const controller={async modelCatalog(){return catalog()}};const original=Object.getOwnPropertyDescriptor(controller,'modelCatalog');const release=installChatModelCatalog(controller);const previous=controller.modelCatalog
 async function later(){return {...await previous.call(this),later:true}}
 controller.modelCatalog=later;release();assert.equal(controller.modelCatalog,later);const restored=await controller.modelCatalog();assert.equal(restored.groups[1].models.length,7);assert.equal(restored.later,true)
 Object.defineProperty(controller,'modelCatalog',original)
})

test('provider failure passes through and an in-flight old catalog is no longer filtered after unload',async()=>{
 let resolve;const wait=new Promise(r=>resolve=r),controller={modelCatalog:()=>wait};const release=installChatModelCatalog(controller),pending=controller.modelCatalog();release();resolve(catalog());assert.equal((await pending).groups[1].models.length,7)
 const bad={async modelCatalog(){throw Error('provider failed')}};const cleanup=installChatModelCatalog(bad);try{await assert.rejects(bad.modelCatalog(),/provider failed/)}finally{cleanup()}
})
