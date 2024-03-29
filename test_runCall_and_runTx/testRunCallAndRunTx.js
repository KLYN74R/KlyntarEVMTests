import {Trie} from '@ethereumjs/trie'
import { Level } from 'level'

import { Address } from '@ethereumjs/util'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { Transaction } from '@ethereumjs/tx'
import { VM } from '@ethereumjs/vm'
import { buildTransaction} from '../helpers/tx-builder.js'
import { getAccountNonce, insertAccount } from '../helpers/account-utils.js'
import { Block } from '@ethereumjs/block'

import { DefaultStateManager } from '@ethereumjs/statemanager'

import {LevelDB} from '../LevelDB.js'

import Web3 from 'web3'





global.__dirname = await import('path').then(async mod=>
  
    mod.dirname(
      
      (await import('url')).fileURLToPath(import.meta.url)
      
    )

)


let web3 = new Web3();

const trie = new Trie({
    
    db:new LevelDB(new Level('../DATABASES/TEST_DB_RUN_CALL_RUN_TX')),

    useKeyHashing:true

})

const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Istanbul })


//Just empty
const block = Block.fromBlockData({ header: { miner:'0x0000000000000000000000000000000000000000', extraData: Buffer.alloc(97), timestamp:133713371337, gasLimit:30000000} }, { common })


async function payment(vm,from,to,value,senderPrivateKey,isJustRunCall) {

    let txObj = {
        from,
        to,
        value,
        nonce:1337//await getAccountNonce(vm,senderPrivateKey)
    }


    const tx = Transaction.fromTxData(buildTransaction(txObj), { common }).sign(senderPrivateKey)

    console.log(block.toJSON())

    console.log('======== TX IS ========')

    // console.log(tx.toJSON())

    let txResult

    if(isJustRunCall){

        txResult = await vm.evm.runCall({tx,block}).catch(e=>e)
    
      }
      else{
    
        txResult = await vm.runTx({tx,block}).catch(e=>e)
    
      }

      console.log('Tx result is ',txResult)

}




async function main() {
    
  const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

  const stateManager = new DefaultStateManager({trie})

  const vm = await VM.create({ common,stateManager })

  const accountAddress = Address.fromPrivateKey(accountPk)


    console.log('Account: ', accountAddress.toString())

    let resultOfPut = await insertAccount(vm, accountAddress)

    console.log('PUT RESULT => ',resultOfPut)

    console.log('The most init state root ',(await vm.stateManager.getStateRoot()).toString('hex'))

    const creatorAccount = await vm.stateManager.getAccount(accountAddress)

    console.log(creatorAccount)

    console.log('Make transaction...')

    let result = await payment(vm,accountAddress,Address.fromString('0x4741c39e6096c192Db6E1375Ff32526512069dF5'),'0xfffffffff',accountPk,true)

    const recepientAccount = await vm.stateManager.getAccount(Address.fromString('0x4741c39e6096c192Db6E1375Ff32526512069dF5'))

    const senderAccount = await vm.stateManager.getAccount(accountAddress)

    console.log(recepientAccount)
    console.log(senderAccount)  

    console.log('ADDRESS => ',Address.fromString('0x407d73d8a49eeb85d32cf465507dd71d507100c1'))
    console.log(await vm.stateManager.getAccount(Address.fromString('0x407d73d8a49eeb85d32cf465507dd71d507100c1')))
    console.log(await vm.stateManager.getAccount(Address.fromString('0x0000000000000000000000000000000000000000')))

}

main()
.then(()=>process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

