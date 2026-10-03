import {readFile,writeFile} from 'node:fs/promises'
const kind=process.argv[2]??'patch',index={major:0,minor:1,patch:2}[kind]
if(index===undefined)throw new Error('Use major, minor or patch')
const manifest=JSON.parse(await readFile('package.json','utf8')),old=manifest.version,parts=old.split('.').map(Number)
parts[index]++;for(let i=index+1;i<3;i++)parts[i]=0
manifest.version=parts.join('.')
await writeFile('package.json',JSON.stringify(manifest,null,2)+'\n')
const lock=JSON.parse(await readFile('package-lock.json','utf8'));lock.version=manifest.version;lock.packages[''].version=manifest.version
await writeFile('package-lock.json',JSON.stringify(lock,null,2)+'\n')
const client=await readFile('src/client.mjs','utf8');await writeFile('src/client.mjs',client.replace(`'data-workbench-shell', '${old}'`,`'data-workbench-shell', '${manifest.version}'`))
console.log('v'+manifest.version)
