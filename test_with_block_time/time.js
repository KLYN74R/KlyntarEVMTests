import { join } from 'path'
import { readFileSync } from 'fs'
import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi'
import { Address } from '@ethereumjs/util'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { Transaction } from '@ethereumjs/tx'
import { VM } from '@ethereumjs/vm'
import { buildTransaction, encodeDeployment, encodeFunction } from '../helpers/tx-builder.js'
import { getAccountNonce, insertAccount } from '../helpers/account-utils.js'
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

const block = Block.fromBlockData({ header: { extraData: Buffer.alloc(97),number:1337, timestamp:133713371337, difficulty:1337, gasLimit:10000000} }, { common })

console.log('Block hash is ',block.hash())

/**
 * This function creates the input for the Solidity compiler.
 *
 * For more info about it, go to https://solidity.readthedocs.io/en/v0.5.10/using-the-compiler.html#compiler-input-and-output-json-description
 *
 * Note: this example additionally needs the Solidity compiler `solc` package (out of EthereumJS
 * scope) being installed. You can do this (in this case it might make sense to install globally)
 * with `npm i -g solc`.
 */
function getSolcInput() {
  return {
    language: 'Solidity',
    sources: {
      'contracts/time.sol': {
        content: readFileSync(join(__dirname, 'contracts', 'time.sol'), 'utf8'),
      },
      // If more contracts were to be compiled, they should have their own entries here
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'petersburg',
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  }
}

/**
 * This function compiles all the contracts in `contracts/` and returns the Solidity Standard JSON
 * output. If the compilation fails, it returns `undefined`.
 *
 * To learn about the output format, go to https://solidity.readthedocs.io/en/v0.5.10/using-the-compiler.html#compiler-input-and-output-json-description
 */
function compileContracts() {
  const input = getSolcInput()
  const output = JSON.parse(solc.compile(JSON.stringify(input)))

  let compilationFailed = false

  if (output.errors) {
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error(error.formattedMessage)
        compilationFailed = true
      } else {
        console.warn(error.formattedMessage)
      }
    }
  }

  if (compilationFailed) {
    return undefined
  }

  return output
}

function getGreeterDeploymentBytecode(solcOutput){
  return solcOutput.contracts['helpers/Greeter.sol'].Greeter.evm.bytecode.object
};





let deployContract=async(vm,senderPrivateKey,deploymentBytecode,greeting)=>{
  // Contracts are deployed by sending their deployment bytecode to the address 0
  // The contract params should be abi-encoded and appended to the deployment bytecode.
  const data = encodeDeployment(deploymentBytecode.toString('hex'))

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





async function getGreeting(vm, contractAddress, caller) {
  const sigHash = new Interface(['function getTime()']).getSighash('getTime')

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

  const results = AbiCoder.decode(['uint256'], greetResult.execResult.returnValue)

  return results[0]
}

async function main() {
    
  const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

  const vm = await VM.create({common})

  const accountAddress = Address.fromPrivateKey(accountPk)


  console.log('Account: ', accountAddress.toString())
  await insertAccount(vm, accountAddress)

  console.log('Compiling...')

  const bytecode = '608060405234801561001057600080fd5b5060b58061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063557ed1ba14602d575b600080fd5b60336047565b604051603e9190605c565b60405180910390f35b600042905090565b6056816075565b82525050565b6000602082019050606f6000830184604f565b92915050565b600081905091905056fea2646970667358221220e51d66ce07e20f9f6c512aadad4eb11477a2cddf1e8a00ce01ecd45e78ddbb0a64736f6c63430008070033'
  
  console.log('Deploying the contract...')

  const contractAddress = await deployContract(vm, accountPk, bytecode, INITIAL_GREETING)

  console.log('Contract address:', contractAddress.toString())

  console.log('Init state root ', (await vm.stateManager.getStateRoot()).toString('hex'))

  const greeting = await getGreeting(vm, contractAddress, accountAddress)

  console.log('Greeting:', Number(greeting))

  console.log('Block is ',block.toJSON())



}

main()
.then(()=>process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

