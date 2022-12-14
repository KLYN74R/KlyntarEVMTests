import {Trie} from '@ethereumjs/trie'
import { Level } from 'level'

import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'
import { Address,Account } from '@ethereumjs/util'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { Transaction } from '@ethereumjs/tx'
import { VM } from '@ethereumjs/vm'
import { buildTransaction, encodeDeployment, encodeFunction } from './helpers/tx-builder.js'
import { getAccountNonce, insertAccount } from './helpers/account-utils.js'
import { Block } from '@ethereumjs/block'

import { DefaultStateManager } from '@ethereumjs/statemanager'

import {createHash} from 'crypto'

import {LevelDB} from './LevelDB.js'

import rlp from '@ethereumjs/rlp'



global.__dirname = await import('path').then(async mod=>
  
    mod.dirname(
      
      (await import('url')).fileURLToPath(import.meta.url)
      
    )

)

const trie = new Trie({
    
    db:new LevelDB(new Level('./PUT_TEST')),

    useKeyHashing:true

})


const INITIAL_GREETING = 'Hello, World!'
const SECOND_GREETING = 'Hola, Mundo!'

const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Istanbul })


//Just empty
const block = Block.fromBlockData({ header: { extraData: Buffer.alloc(97)} }, { common })



let deployContract=async(vm,senderPrivateKey,deploymentBytecode,greeting)=>{
  // Contracts are deployed by sending their deployment bytecode to the address 0
  // The contract params should be abi-encoded and appended to the deployment bytecode.
  const data = encodeDeployment(deploymentBytecode.toString('hex'), {
    types: ['string'],
    values: [greeting],
  })
  const txData = {
    data,
    nonce: await getAccountNonce(vm,senderPrivateKey),
    gasLimit:1000000
  }

  const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)


  const deploymentResult = await vm.runTx({ tx,block }).catch(e=>console.log(e))

//   console.log('DEPLOYMENT ',deploymentResult)


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

  const setGreetingResult = await vm.runTx({ tx , block})

  console.log('setGreetingGasSpent() => Gas used:',setGreetingResult.execResult.executionGasUsed.toString())

  if (setGreetingResult.execResult.exceptionError) {

    throw setGreetingResult.execResult.exceptionError
  }
}

async function getGreeting(vm, contractAddress, caller) {
    
  const sigHash = new Interface(['function greet()']).getSighash('greet')

  console.log('SigHash to getGreeting() => ', sigHash)

  const greetResult = await vm.evm.runCall({
    to: contractAddress,
    caller: caller,
    origin: caller, // The tx.origin is also the caller here
    data: Buffer.from(sigHash.slice(2),'hex'),
    block,
  })

  if (greetResult.execResult.exceptionError) {
    throw greetResult.execResult.exceptionError
  }

  console.log('getGreeting() => Gas used:',greetResult.execResult.executionGasUsed.toString())

  console.log(greetResult)

  const results = AbiCoder.decode(['string'], greetResult.execResult.returnValue)

  console.log(results)

  return results[0]
}

















async function main() {
    
  const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

  const stateManager = new DefaultStateManager({trie})

  const vm = await VM.create({ common,stateManager })

//   const accountAddress = Address.fromPrivateKey(accountPk)

//  console.log('Account: ', accountAddress.toString())

  //====================================
    // console.log((await vm.stateManager.getStateRoot()).toString('hex'))

//     //  console.log((await vm.stateManager.getStateRoot()).toString('hex'))

//    await vm.stateManager.getAccount(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(console.log)
 
//  await vm.stateManager.setStateRoot(Buffer.from('7db328fe789b5382a3eba7650f8b650c125ccb8feba0424696cce8e53bfbc406'))

    
    //await vm.stateManager.getContractCode(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(buf=>console.log(buf.toString('hex')))




    await vm.stateManager.setStateRoot(Buffer.from('5a4dad806cb5811f48452c67679fede7ed198598c540ea4bea2872e481daf95b','hex'))

// //    await setGreeting(vm,accountPk,Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7'),'LA-LA-LA')
 
    const greeting = await getGreeting(vm,Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7'),Address.fromPrivateKey(accountPk))

    console.log(greeting)

//     // await vm.stateManager.getContractCode(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(buf=>console.log(buf.toString('hex')))
    
//     await vm.stateManager.putContractStorage(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7'),Buffer.from('290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563','hex'),Buffer.from(rlp.decode('0xa0486f6c612c204d756e646f210000000000000000000000000000000000000018')))
//     await vm.stateManager.dumpStorage(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(buf=>console.log(buf))
    
//     await vm.stateManager.getAccount(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(console.log)
//     await vm.stateManager.getAccount(Address.fromPrivateKey(accountPk)).then(console.log)


//_____________________ WRITE ________________________


    // await vm.stateManager.checkpoint()

    // //Put user acc

    // const acctData = {
    //     nonce: 2,
    //     balance: BigInt(999999999999685484), // 1 eth
    // },

    // userAddress = Address.fromPrivateKey(accountPk)

    // const accountUser = Account.fromAccountData(acctData)
      
    // await vm.stateManager.putAccount(userAddress,accountUser).then(()=>console.log('Account putted'))
    
      



    // let contractCode = '608060405234801561001057600080fd5b50600436106100365760003560e01c8063a41368621461003b578063cfae321714610050575b600080fd5b61004e610049366004610126565b61006e565b005b61005861007e565b60405161006591906101d7565b60405180910390f35b600061007a82826102ae565b5050565b60606000805461008d90610225565b80601f01602080910402602001604051908101604052809291908181526020018280546100b990610225565b80156101065780601f106100db57610100808354040283529160200191610106565b820191906000526020600020905b8154815290600101906020018083116100e957829003601f168201915b5050505050905090565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561013857600080fd5b813567ffffffffffffffff8082111561015057600080fd5b818401915084601f83011261016457600080fd5b81358181111561017657610176610110565b604051601f8201601f19908116603f0116810190838211818310171561019e5761019e610110565b816040528281528760208487010111156101b757600080fd5b826020860160208301376000928101602001929092525095945050505050565b600060208083528351808285015260005b81811015610204578581018301518582016040015282016101e8565b506000604082860101526040601f19601f8301168501019250505092915050565b600181811c9082168061023957607f821691505b60208210810361025957634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156102a957600081815260208120601f850160051c810160208610156102865750805b601f850160051c820191505b818110156102a557828155600101610292565b5050505b505050565b815167ffffffffffffffff8111156102c8576102c8610110565b6102dc816102d68454610225565b8461025f565b602080601f83116001811461031157600084156102f95750858301515b600019600386901b1c1916600185901b1785556102a5565b600085815260208120601f198616915b8281101561034057888601518255948401946001909101908401610321565b508582101561035e5787850151600019600388901b60f8161c191681555b5050505050600190811b0190555056fea26469706673582212207240ad758772a27912da8339241b6ba9ecaaeffbe8460ca0ef50dc4a301f5fb764736f6c63430008110033'

    // // let contractCoda = '608060405234801561001057600080fd5b50600436106100365760003560e01c8063a41368621461003b578063cfae321714610050575b600080fd5b61004e610049366004610126565b61006e565b005b61005861007e565b60405161006591906101d7565b60405180910390f35b600061007a82826102ae565b5050565b60606000805461008d90610225565b80601f01602080910402602001604051908101604052809291908181526020018280546100b990610225565b80156101065780601f106100db57610100808354040283529160200191610106565b820191906000526020600020905b8154815290600101906020018083116100e957829003601f168201915b5050505050905090565b634e487b7160e01b600052604160045260246000fd5b60006020828403121561013857600080fd5b813567ffffffffffffffff8082111561015057600080fd5b818401915084601f83011261016457600080fd5b81358181111561017657610176610110565b604051601f8201601f19908116603f0116810190838211818310171561019e5761019e610110565b816040528281528760208487010111156101b757600080fd5b826020860160208301376000928101602001929092525095945050505050565b600060208083528351808285015260005b81811015610204578581018301518582016040015282016101e8565b506000604082860101526040601f19601f8301168501019250505092915050565b600181811c9082168061023957607f821691505b60208210810361025957634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156102a957600081815260208120601f850160051c810160208610156102865750805b601f850160051c820191505b818110156102a557828155600101610292565b5050505b505050565b815167ffffffffffffffff8111156102c8576102c8610110565b6102dc816102d68454610225565b8461025f565b602080601f83116001811461031157600084156102f95750858301515b600019600386901b1c1916600185901b1785556102a5565b600085815260208120601f198616915b8281101561034057888601518255948401946001909101908401610321565b508582101561035e5787850151600019600388901b60f8161c191681555b5050505050600190811b0190555056fea26469706673582212207240ad758772a27912da8339241b6ba9ecaaeffbe8460ca0ef50dc4a301f5fb764736f6c63430008110033'
    
    // let contractAccount={
    //     nonce: 1,
    //     balance: BigInt(0) ** BigInt(18)
    // }

    // await vm.stateManager.putAccount(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7'),Account.fromAccountData(contractAccount))

    // await vm.stateManager.putContractCode(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7'),Buffer.from(contractCode,'hex'))

    // await vm.stateManager.putContractStorage(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7'),Buffer.from('290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563','hex'),Buffer.from('486f6c612c204d756e646f210000000000000000000000000000000000000018','hex'))

    // await vm.stateManager.commit()

    // console.log('Written!')

    // console.log((await vm.stateManager.getStateRoot()).toString('hex'))


    // await vm.stateManager.getAccount(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(console.log)
    // await vm.stateManager.getAccount(userAddress).then(console.log)

    // await vm.stateManager.dumpStorage(Address.fromString('0x61de9dc6f6cff1df2809480882cfd3c2364b28f7')).then(buf=>console.log(buf))

}

main()
.then(()=>process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

