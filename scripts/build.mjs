import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
await mkdir('dist', { recursive: true })
await writeFile('dist/index.mjs', await readFile('src/index.mjs', 'utf8'))
await writeFile('dist/chat-model-catalog.mjs', await readFile('src/chat-model-catalog.mjs', 'utf8'))
const result = await build({ entryPoints:['src/client.mjs'], outfile:'dist/client-body.js', write:false, bundle:true, platform:'browser', format:'cjs', jsx:'automatic', target:'es2022', external:['react','react/jsx-runtime','react-dom','@deepseek-ai/*'], loader:{'.png':'dataurl','.jpg':'dataurl','.svg':'dataurl'} })
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text
const css = await readFile('src/shell.css','utf8')
// Apply runs after factory style discovery; tag ownership before insertion so
// another module cannot claim this stylesheet and remove it during its HMR.
await writeFile('dist/client.js', `window.__ModuleLoader__.load({id:'dsh-workbench-shell',factory(require){var module={exports:{}};var exports=module.exports;${js}\nconst plugin=module.exports;return {...plugin,apply(ctx){ctx.effect(()=>{const style=document.createElement('style');style.setAttribute('data-plugin','dsh-workbench-shell');style.setAttribute('data-plugin-css','dsh-workbench-shell');style.setAttribute('data-workbench-navigation-style','');style.textContent=${JSON.stringify(css)};document.head.append(style);return()=>style.remove()});return plugin.apply(ctx)}}}});\n`)
console.log('Built independent navigation for official Web client')
