let CONTRACT_STATE = {

    key:'290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563',
    value:'a0486f6c612c204d756e646f210000000000000000000000000000000000000018'
  
}


import { join } from 'path'
import { readFileSync } from 'fs'
import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'
import { Address } from '@ethereumjs/util'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { Transaction } from '@ethereumjs/tx'
import { VM } from '@ethereumjs/vm'
import { buildTransaction, encodeDeployment, encodeFunction } from './helpers/tx-builder.js'
import { getAccountNonce, insertAccount } from './helpers/account-utils.js'
import { Block } from '@ethereumjs/block'
import { Blockchain } from '@ethereumjs/blockchain'
import {Level} from 'level'

import { DefaultStateManager } from '@ethereumjs/statemanager'


import solc from 'solc'


global.__dirname = await import('path').then(async mod=>
  
    mod.dirname(
      
      (await import('url')).fileURLToPath(import.meta.url)
      
    )

)

const INITIAL_GREETING = 'Hello, World!'
const SECOND_GREETING = 'Hola, Mundo!'

const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Istanbul })


const gethDbPath = '../DATABASES/RUN' // Add your own path here. It will get modified, see remarks.


const db = new Level(gethDbPath)
// Use the safe static constructor which awaits the init method
const blockchain = await Blockchain.create({ common, db ,validateBlocks:true})




let zeroBlock = await blockchain.getBlock(0)


const block = Block.fromBlockData({ header: { extraData: Buffer.alloc(97),number:1,parentHash: zeroBlock.hash(), timestamp:1665063598, difficulty:1, gasLimit:10000000} }, { common })



let deployContract=async(vm,senderPrivateKey,deploymentBytecode,greeting)=>{
  // Contracts are deployed by sending their deployment bytecode to the address 0
  // The contract params should be abi-encoded and appended to the deployment bytecode.
  const data = encodeDeployment(deploymentBytecode.toString('hex'), {
    types: ['string'],
    values: [greeting],
  })
  const txData = {
    data,
    nonce: await getAccountNonce(vm, senderPrivateKey),
    gasLimit:1000000
  }

  const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

  console.log('TX IS ',tx)

  const deploymentResult = await vm.runTx({ tx, block })

  if (deploymentResult.execResult.exceptionError) {
    throw deploymentResult.execResult.exceptionError
  }

  return deploymentResult.createdAddress
}

async function setGreeting(vm,senderPrivateKey,contractAddress,greeting) {

  const data = encodeFunction('setGreeting', {
    types: ['string'],
    values: [greeting],
  })

  console.log('DATA WHEN setGreeting() ',data)

  const txData = {
    to: contractAddress,
    data,
    nonce: await getAccountNonce(vm, senderPrivateKey),
  }

  const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

  const setGreetingResult = await vm.runTx({ tx, block })

  console.log('setGreetingGasSpent() => Gas used:',setGreetingResult.execResult.executionGasUsed.toString())

  if (setGreetingResult.execResult.exceptionError) {

    throw setGreetingResult.execResult.exceptionError
  }
}

async function getGreeting(vm, contractAddress, caller) {
  const sigHash = new Interface(['function greet()']).getSighash('greet')

  const greetResult = await vm.evm.runCall({
    to: contractAddress,
    caller: caller,
    origin: caller, // The tx.origin is also the caller here
    data: Buffer.from(sigHash.slice(2), 'hex'),
    block,
  })

  if (greetResult.execResult.exceptionError) {
    throw greetResult.execResult.exceptionError
  }

  console.log('getGreeting() => Gas used:',greetResult.execResult.executionGasUsed.toString())

  const results = AbiCoder.decode(['string'], greetResult.execResult.returnValue)

  return results[0]
}

async function main() {
    
  const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

  const vm = await VM.create({ common,blockchain })
  const accountAddress = Address.fromPrivateKey(accountPk)


  console.log('Account: ', accountAddress.toString())
  await insertAccount(vm, accountAddress)

  const bytecode = '608060405234801561001057600080fd5b5060405161064e38038061064e83398101604081905261002f91610071565b600061003b82826101dc565b505061029b565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000602080838503121561008457600080fd5b82516001600160401b038082111561009b57600080fd5b818501915085601f8301126100af57600080fd5b8151818111156100c1576100c1610042565b604051601f8201601f19908116603f011681019083821181831017156100e9576100e9610042565b81604052828152888684870101111561010157600080fd5b600093505b828410156101235784840186015181850187015292850192610106565b600086848301015280965050505050505092915050565b600181811c9082168061014e57607f821691505b602082108103610187577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b601f8211156101d757600081815260208120601f850160051c810160208610156101b45750805b601f850160051c820191505b818110156101d3578281556001016101c0565b5050505b505050565b81516001600160401b038111156101f5576101f5610042565b61020981610203845461013a565b8461018d565b602080601f83116001811461023e57600084156102265750858301515b600019600386901b1c1916600185901b1785556101d3565b600085815260208120601f198616915b8281101561026d5788860151825594840194600190910190840161024e565b508582101561028b5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b6103a4806102aa6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063a41368621461003b578063cfae321714610050575b600080fd5b61004e610049366004610126565b61006e565b005b61005861007e565b60405161006591906101d7565b60405180910390f35b600061007a82826102ae565b5050565b60606000805461008d90610225565b80601f01602080910402602001604051908101604052809291908181526020018280546100b990610225565b80156101065780601f106100db57610100808354040283529160200191610106565b820191906000526020600020905b8154815290600101906020018083116100e957829003601f168201915b5050505050905090565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561013857600080fd5b813567ffffffffffffffff8082111561015057600080fd5b818401915084601f83011261016457600080fd5b81358181111561017657610176610110565b604051601f8201601f19908116603f0116810190838211818310171561019e5761019e610110565b816040528281528760208487010111156101b757600080fd5b826020860160208301376000928101602001929092525095945050505050565b600060208083528351808285015260005b81811015610204578581018301518582016040015282016101e8565b506000604082860101526040601f19601f8301168501019250505092915050565b600181811c9082168061023957607f821691505b60208210810361025957634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156102a957600081815260208120601f850160051c810160208610156102865750805b601f850160051c820191505b818110156102a557828155600101610292565b5050505b505050565b815167ffffffffffffffff8111156102c8576102c8610110565b6102dc816102d68454610225565b8461025f565b602080601f83116001811461031157600084156102f95750858301515b600019600386901b1c1916600185901b1785556102a5565b600085815260208120601f198616915b8281101561034057888601518255948401946001909101908401610321565b508582101561035e5787850151600019600388901b60f8161c191681555b5050505050600190811b0190555056fea26469706673582212207240ad758772a27912da8339241b6ba9ecaaeffbe8460ca0ef50dc4a301f5fb764736f6c63430008110033'

  console.log('Put the bytecode to VM state manager...')

  await vm.stateManager.putContractCode(new Address(Buffer.from('61de9dc6f6cff1df2809480882cfd3c2364b28f7','hex')),Buffer.from(bytecode,'hex'))

  console.log('Put the contract state to VM state manager...')

  // await vm.stateManager.putContractStorage(new Address(Buffer.from('61de9dc6f6cff1df2809480882cfd3c2364b28f7','hex')),Buffer.from(CONTRACT_STATE.key,'hex'),Buffer.from(CONTRACT_STATE.value,'hex'))

  console.log('Init state root ', (await vm.stateManager.getStateRoot()).toString('hex'))

  const greeting = await getGreeting(vm, new Address(Buffer.from('61de9dc6f6cff1df2809480882cfd3c2364b28f7','hex')), accountAddress)

  console.log('Greeting:', greeting)


}

main()
.then(()=>process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

