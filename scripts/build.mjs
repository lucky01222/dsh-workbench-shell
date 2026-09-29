import {mkdir,readFile,writeFile} from 'node:fs/promises'
await mkdir('dist',{recursive:true})
await writeFile('dist/index.mjs',await readFile('src/index.mjs','utf8'))
const source=(await readFile('src/client.mjs','utf8')).replace("import { createElement as h, Fragment, useSyncExternalStore } from 'react'", "const {createElement:h,Fragment,useSyncExternalStore}=require('react')")
 .replace("import { FishLogo, IconPanelLeftOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'", "const {FishLogo,IconPanelLeftOutlineRegular,Tooltip}=require('@deepseek-ai/dsh-client-ui-primitives')")
 .replaceAll('export ','')
const css=await readFile('src/shell.css','utf8')
await writeFile('dist/client.js',`window.__ModuleLoader__.load({id:'dsh-workbench-shell',factory(require){${source}\nreturn {inject,apply(ctx){ctx.effect(()=>{const style=document.createElement('style');style.setAttribute('data-workbench-navigation-style','');style.textContent=${JSON.stringify(css)};document.head.append(style);return()=>style.remove()});return apply(ctx)}}}});\n`)
console.log('Built navigation skin for official Web client')
