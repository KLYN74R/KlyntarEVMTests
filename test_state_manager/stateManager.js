import {Trie} from '@ethereumjs/trie'
import { Level } from 'level'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { Account, Address } from '@ethereumjs/util'
import {LevelDB} from '../LevelDB.js'

const trie = new Trie({
    
    db:new LevelDB(new Level('../DATABASES/STATE')),

    useKeyHashing:true

})

const acctData = {
    nonce: 0,
    balance: BigInt(10) ** BigInt(18), // 1 eth
  
}

const account = Account.fromAccountData(acctData)

const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

const accountAddress = Address.fromPrivateKey(accountPk)

console.log(accountAddress)

let stateManager = new DefaultStateManager({trie})

await stateManager.setStateRoot(Buffer.from('ee4a25ef151f1ac972944a2d474e87d91ac5962e4bff09c5674d89f40647a4fc','hex'))


// await stateManager.checkpoint()

// await stateManager.putAccount(accountAddress,account)

// await stateManager.commit()

// console.log((await stateManager.getStateRoot()).toString('hex'))

await stateManager.getAccount(accountAddress).then(console.log)