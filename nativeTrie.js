import { Trie } from '@ethereumjs/trie'
import {LevelDB} from './LevelDB.js'
import { Level } from 'level'

const trie = new Trie({ db: new LevelDB(new Level('./MY_TRIE_DB_LOCATION')) })

async function test() {
  await trie.put(Buffer.from('test'), Buffer.from('one'))
  const value = await trie.get(Buffer.from('test'))
  console.log(value.toString()) // 'one'
}

test()


