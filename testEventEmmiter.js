import {Trie} from '@ethereumjs/trie'
import { Level } from 'level'

import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'
import { Address } from '@ethereumjs/util'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { Transaction } from '@ethereumjs/tx'
import { VM } from '@ethereumjs/vm'
import { buildTransaction, encodeDeployment, encodeFunction } from './helpers/tx-builder.js'
import { getAccountNonce, insertAccount } from './helpers/account-utils.js'
import { Block } from '@ethereumjs/block'

import { DefaultStateManager } from '@ethereumjs/statemanager'


import {LevelDB} from './LevelDB.js'

import Web3 from 'web3'

global.__dirname = await import('path').then(async mod=>
  
    mod.dirname(
      
      (await import('url')).fileURLToPath(import.meta.url)
      
    )

)


let web3 = new Web3();

const trie = new Trie({
    
    db:new LevelDB(new Level('./EVENT_EMMITER')),

    useKeyHashing:true

})


const INITIAL_GREETING = 'Hello, World!'
const SECOND_GREETING = 'Hola, Mundo!'

const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Istanbul })


//Just empty
const block = Block.fromBlockData({ header: { extraData: Buffer.alloc(97), timestamp:133713371337 } }, { common })



let deployContract=async(vm,senderPrivateKey,deploymentBytecode)=>{

  // Contracts are deployed by sending their deployment bytecode to the address 0
  // The contract params should be abi-encoded and appended to the deployment bytecode.
  const data = encodeDeployment(deploymentBytecode.toString('hex'))
  
  const txData = {
    data,
    nonce: await getAccountNonce(vm,senderPrivateKey),
    gasLimit:1000000
  }

  const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)


  const deploymentResult = await vm.runTx({ tx,block }).catch(e=>console.log(e))

  console.log('Deployment result is ',deploymentResult)

  if (deploymentResult.execResult.exceptionError) {

    throw deploymentResult.execResult.exceptionError
  }

  return deploymentResult.createdAddress

}




async function makeCheckpoint(vm,senderPrivateKey,contractAddress,aggregatedCheckpoint) {

  const data = encodeFunction('change', {
    types: ['string'],
    values: [aggregatedCheckpoint],
  })

  console.log('DATA WHEN setGreeting() ',data)

  const txData = {
    to: contractAddress,
    data,
    nonce: await getAccountNonce(vm, senderPrivateKey),
  }

  const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

  console.log(tx)

  const setGreetingResult = await vm.runTx({ tx , block})


  console.log(setGreetingResult)


  let ABI = `

  [
    {
        "indexed": false,
        "internalType": "string",
        "name": "payload",
        "type": "string"
    },
    {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocktime",
        "type": "uint256"
    }
]
  
`

  
  let pureHex = '0x'+setGreetingResult.receipt.logs[0][2].toString('hex'), topicsInHex = setGreetingResult.receipt.logs[0][1].map(x=>'0x'+x.toString('hex'))

  console.log(pureHex)

  console.log(topicsInHex)

  console.log(web3.eth.abi.decodeLog(JSON.parse(ABI),pureHex,topicsInHex))
  

//   console.log(Buffer.from(setGreetingResult.execResult.logs[0][2]).toString('hex'))


  console.log('setGreetingGasSpent() => Gas used:',setGreetingResult.execResult.executionGasUsed.toString())

  if (setGreetingResult.execResult.exceptionError) {

    throw setGreetingResult.execResult.exceptionError
  
    }

}




async function main() {
    
  const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

  const stateManager = new DefaultStateManager({trie})

  const vm = await VM.create({ common,stateManager })

  const accountAddress = Address.fromPrivateKey(accountPk)



    console.log('Account: ', accountAddress.toString())

    await insertAccount(vm, accountAddress)

    console.log((await vm.stateManager.getStateRoot()).toString('hex'))

    console.log('Compiling...')

    let bytecode = '608060405234801561001057600080fd5b50610332806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063c1dcab1414610030575b600080fd5b61004a600480360381019061004591906100f8565b61004c565b005b7f5d882878f6c50530e63829854e64755332e385dbf9dd9c2798e07d9c88c67e40814260405161007d929190610189565b60405180910390a150565b600061009b610096846101de565b6101b9565b9050828152602081018484840111156100b7576100b66102dc565b5b6100c2848285610235565b509392505050565b600082601f8301126100df576100de6102d7565b5b81356100ef848260208601610088565b91505092915050565b60006020828403121561010e5761010d6102e6565b5b600082013567ffffffffffffffff81111561012c5761012b6102e1565b5b610138848285016100ca565b91505092915050565b600061014c8261020f565b610156818561021a565b9350610166818560208601610244565b61016f816102eb565b840191505092915050565b6101838161022b565b82525050565b600060408201905081810360008301526101a38185610141565b90506101b2602083018461017a565b9392505050565b60006101c36101d4565b90506101cf8282610277565b919050565b6000604051905090565b600067ffffffffffffffff8211156101f9576101f86102a8565b5b610202826102eb565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b6000819050919050565b82818337600083830152505050565b60005b83811015610262578082015181840152602081019050610247565b83811115610271576000848401525b50505050565b610280826102eb565b810181811067ffffffffffffffff8211171561029f5761029e6102a8565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f830116905091905056fea2646970667358221220398ea5072fb57de9ad9b51267ced7a3fffa5481069b2975c4d818bdf41b0ca5864736f6c63430008070033'
    

    console.log('Deploying the contract...')

  const contractAddress = await deployContract(vm,accountPk,bytecode)

  console.log('Contract address:', contractAddress.toString())

  console.log('Init state root ', (await vm.stateManager.getStateRoot()).toString('hex'))

    console.log('Push new checkpoint to hostchain')


    let result = await makeCheckpoint(vm,accountPk,contractAddress,'KLYNTAR CHECKPOINT LALALLALALLALALAAAAAA')


    console.log('Execution result => ',result)

    console.log('State root after checkpoint', (await vm.stateManager.getStateRoot()).toString('hex'))
    
  const createdAccount = await vm.stateManager.getAccount(contractAddress)

  console.log('-------results-------')
  console.log('nonce: ' + createdAccount.nonce.toString())
  console.log('balance in wei: ', createdAccount.balance.toString())
  console.log('storageRoot: 0x' + createdAccount.storageRoot.toString('hex'))
  console.log('codeHash: 0x' + createdAccount.codeHash.toString('hex'))
  console.log('---------------------')

  console.log('Everything ran correctly!')

  

}

main()
.then(()=>process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

