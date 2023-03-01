import {Trie} from '@ethereumjs/trie'
import { Level } from 'level'

const trie = new Level('../DATABASES/PATRICIA',{valueEncoding:'buffer',keyEncoding:'buffer'})


// trie.createReadStream().on('data',data=>console.log(data.key.toString('utf8'),' => ',data.value.toString('utf8')))

let promises = []

for(let i=0;i<10000;i++) promises.push(trie.put(Buffer.from('test'+i),Buffer.from('one'+i)))

await Promise.all(promises).then(async()=>{

    console.log('Done')

})