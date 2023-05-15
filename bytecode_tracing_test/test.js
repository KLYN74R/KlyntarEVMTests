import {getAccountNonce,insertAccount} from '../helpers/account-utils.js'
import {buildTransaction,encodeFunction} from '../helpers/tx-builder.js'
import {DefaultStateManager} from '@ethereumjs/statemanager'
import {Chain,Common,Hardfork} from '@ethereumjs/common'
import {Transaction} from '@ethereumjs/tx'
import {Address} from '@ethereumjs/util'
import {Block} from '@ethereumjs/block'
import {Trie} from '@ethereumjs/trie'
import {LevelDB} from '../LevelDB.js'
import {VM} from '@ethereumjs/vm'
import {Level} from 'level'



// Test with custom opcodes
import { EEI } from '@ethereumjs/vm'
import {EVM} from '@ethereumjs/evm'


import Web3 from 'web3'
let web3 = new Web3();


// To test decoder

import { Interface, defaultAbiCoder as AbiCoder } from '@ethersproject/abi'



global.__dirname = await import('path').then(async mod=>
  
    mod.dirname(
      
      (await import('url')).fileURLToPath(import.meta.url)
      
    )

)


const common = new Common({chain:Chain.Rinkeby,hardfork:Hardfork.Istanbul})

const block = Block.fromBlockData({ header: { extraData: Buffer.alloc(97),number:1,timestamp:1665063598, difficulty:1, gasLimit:10000000} }, { common })


const trie = new Trie({
      
    db:new LevelDB(new Level('DATABASES/STACK_TRACE'))

})
  



//------------------------------------------------- 3 FUNCTIONS ------------------------------------------------




let deployContract=async(vm,senderPrivateKey,deploymentBytecode)=>{
  
    const txData = {
        data:`0x${deploymentBytecode}`,
        nonce: await getAccountNonce(vm,senderPrivateKey),
        gasLimit:1000000
    }

    const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

    const deploymentResult = await vm.runTx({ tx, block })

    if (deploymentResult.execResult.exceptionError) {
        throw deploymentResult.execResult.exceptionError
    }

    return deploymentResult.createdAddress

}


async function crossContractCallFromCallerToReceiver(vm,senderPrivateKey,callerContractAddress,receiverContractAddress) {

    const data = encodeFunction('testCallFoo', {
    
        types: ['address'],
        values: [receiverContractAddress],
    
    })

    console.log('\n=========== Just for proof ============\n')

    let dataForProof = encodeFunction('foo', {

        types: ['string','uint256'],
        values: ["call foo",123],
    
    })

    console.log(dataForProof)

    console.log('And decoded version')

    // Slice the first 4 bytes(function signature)

    dataForProof = dataForProof.slice(10)

    console.log('And decoded version')

    console.log(dataForProof)

    console.log(AbiCoder.decode(['string','uint256'],'0x'+dataForProof))

    console.log('DATA WHEN testCallFoo() ',data)

    const txData = {
        to: callerContractAddress,
        data,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

    const setGreetingResult = await vm.runTx({ tx, block })

    console.log('testCallFoo() => Gas used:',setGreetingResult.execResult.executionGasUsed.toString())

    console.log('Try to get logs from caller contract')

    let logs = setGreetingResult.execResult.logs[1]

    let INPUTS_ABI = [
        {
            "indexed": false,
            "internalType": "bool",
            "name": "success",
            "type": "bool"
        },
        {
            "indexed": false,
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
        }
    ]
    
    console.log(logs)

    // Decode logs

    let pureHex = '0x'+logs[2].toString('hex'), topicsInHex = logs[1].map(x=>'0x'+x.toString('hex'))

    console.log('Contract address of logs is => ','0x'+logs[0].toString('hex'))
  
    console.log(web3.eth.abi.decodeLog(INPUTS_ABI,pureHex,topicsInHex))

    if (setGreetingResult.execResult.exceptionError) {

        throw setGreetingResult.execResult.exceptionError
    }

}


//------------------------------------------------- MAIN FUNCTIONALITY ------------------------------------------------


async function main() {


    //-------------------- Preparations --------------------
    

    const accountPk = Buffer.from('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109','hex')

    const accountAddress = Address.fromPrivateKey(accountPk)

    const stateManager = new DefaultStateManager({trie})

    // let evm = new EVM()

    const eei = new EEI(stateManager,common)

    const evm = new EVM({
        common,
        eei,
        customOpcodes:[]
    })


    // Create the VM instance
    const vm = await VM.create({common,stateManager,evm})
  
  
    //-------------------- Put initial account --------------------

    console.log('Account => ', accountAddress.toString())

    await insertAccount(vm,accountAddress)
  
    console.log('The most init state root => ',(await vm.stateManager.getStateRoot()).toString('hex'))


    //-------------------- Deploy contracts --------------------

    const CALLER_CONTRACT_BYTECODE = '608060405234801561001057600080fd5b506105a8806100206000396000f3fe6080604052600436106100295760003560e01c806387ba61791461002e578063ff00726c1461004a575b600080fd5b6100486004803603810190610043919061033a565b610066565b005b610064600480360381019061005f919061033a565b6101a7565b005b6000808273ffffffffffffffffffffffffffffffffffffffff163461138890607b6040516024016100979190610416565b6040516020818303038152906040527f24ccab8f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405161012191906104b5565b600060405180830381858888f193505050503d806000811461015f576040519150601f19603f3d011682016040523d82523d6000602084013e610164565b606091505b50915091507f13848c3e38f8886f3f5d2ad9dff80d8092c2bbb8efd5b887a99c2c6cfc09ac2a828260405161019a929190610542565b60405180910390a1505050565b6000808273ffffffffffffffffffffffffffffffffffffffff16346040516024016040516020818303038152906040527f1dcc85ae000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405161025291906104b5565b60006040518083038185875af1925050503d806000811461028f576040519150601f19603f3d011682016040523d82523d6000602084013e610294565b606091505b50915091507f13848c3e38f8886f3f5d2ad9dff80d8092c2bbb8efd5b887a99c2c6cfc09ac2a82826040516102ca929190610542565b60405180910390a1505050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610307826102dc565b9050919050565b610317816102fc565b811461032257600080fd5b50565b6000813590506103348161030e565b92915050565b6000602082840312156103505761034f6102d7565b5b600061035e84828501610325565b91505092915050565b600082825260208201905092915050565b7f63616c6c20666f6f000000000000000000000000000000000000000000000000600082015250565b60006103ae600883610367565b91506103b982610378565b602082019050919050565b6000819050919050565b600060ff82169050919050565b6000819050919050565b60006104006103fb6103f6846103c4565b6103db565b6103ce565b9050919050565b610410816103e5565b82525050565b6000604082019050818103600083015261042f816103a1565b905061043e6020830184610407565b92915050565b600081519050919050565b600081905092915050565b60005b8381101561047857808201518184015260208101905061045d565b60008484015250505050565b600061048f82610444565b610499818561044f565b93506104a981856020860161045a565b80840191505092915050565b60006104c18284610484565b915081905092915050565b60008115159050919050565b6104e1816104cc565b82525050565b600082825260208201905092915050565b6000601f19601f8301169050919050565b600061051482610444565b61051e81856104e7565b935061052e81856020860161045a565b610537816104f8565b840191505092915050565b600060408201905061055760008301856104d8565b81810360208301526105698184610509565b9050939250505056fea264697066735822122022aa4f3c9db7e0939ea5dd2023bdfe3bedd2e825e8fcc1815417dc87c75cce1464736f6c63430008110033'

    const RECEIVED_CONTRACT_BYTECODE = '608060405234801561001057600080fd5b50610515806100206000396000f3fe6080604052600436106100225760003560e01c806324ccab8f1461005e57610023565b5b7f59e04c3f0d44b7caf6e8ef854b61d9a51cf1960d7a88ff6356cc5e946b4b58323334604051610054929190610197565b60405180910390a1005b61007860048036038101906100739190610359565b61008e565b60405161008591906103b5565b60405180910390f35b60007f59e04c3f0d44b7caf6e8ef854b61d9a51cf1960d7a88ff6356cc5e946b4b58323334856040516100c39392919061043e565b60405180910390a16001826100d891906104ab565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061010b826100e0565b9050919050565b61011b81610100565b82525050565b6000819050919050565b61013481610121565b82525050565b600082825260208201905092915050565b7f46616c6c6261636b207761732063616c6c656400000000000000000000000000600082015250565b600061018160138361013a565b915061018c8261014b565b602082019050919050565b60006060820190506101ac6000830185610112565b6101b9602083018461012b565b81810360408301526101ca81610174565b90509392505050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61023a826101f1565b810181811067ffffffffffffffff8211171561025957610258610202565b5b80604052505050565b600061026c6101d3565b90506102788282610231565b919050565b600067ffffffffffffffff82111561029857610297610202565b5b6102a1826101f1565b9050602081019050919050565b82818337600083830152505050565b60006102d06102cb8461027d565b610262565b9050828152602081018484840111156102ec576102eb6101ec565b5b6102f78482856102ae565b509392505050565b600082601f830112610314576103136101e7565b5b81356103248482602086016102bd565b91505092915050565b61033681610121565b811461034157600080fd5b50565b6000813590506103538161032d565b92915050565b600080604083850312156103705761036f6101dd565b5b600083013567ffffffffffffffff81111561038e5761038d6101e2565b5b61039a858286016102ff565b92505060206103ab85828601610344565b9150509250929050565b60006020820190506103ca600083018461012b565b92915050565b600081519050919050565b60005b838110156103f95780820151818401526020810190506103de565b60008484015250505050565b6000610410826103d0565b61041a818561013a565b935061042a8185602086016103db565b610433816101f1565b840191505092915050565b60006060820190506104536000830186610112565b610460602083018561012b565b81810360408301526104728184610405565b9050949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006104b682610121565b91506104c183610121565b92508282019050808211156104d9576104d861047c565b5b9291505056fea2646970667358221220b0eeeb0bfe4a244542a9822c327bba180a729e871184eaaaae80e54ec76fd65e64736f6c63430008110033'


    console.log('Deploying the contracts...')
   

    const contractAddressOfCaller = await deployContract(vm,accountPk,CALLER_CONTRACT_BYTECODE)

    const contractAddressOfReceiver = await deployContract(vm,accountPk,RECEIVED_CONTRACT_BYTECODE)


    console.log('Caller contract address => ', contractAddressOfCaller.toString())

    console.log('Receiver contract address => ', contractAddressOfReceiver.toString())


    console.log('State root after deployment 2 contracts => ', (await vm.stateManager.getStateRoot()).toString('hex'))


    console.log('Account of caller contract ',await vm.stateManager.getAccount(contractAddressOfCaller))

    console.log('Account of receiver contract ',await vm.stateManager.getAccount(contractAddressOfReceiver))


    await crossContractCallFromCallerToReceiver(vm,accountPk,contractAddressOfCaller,contractAddressOfReceiver.toString())


    // const greeting = await getGreeting(vm,contractAddressOfCaller,accountAddress)

    // console.log('Greeting after deploy => ', greeting)

    // console.log('State root after getGreeting() (should be the same as before get function call)=> ', (await vm.stateManager.getStateRoot()).toString('hex'))

    // if (greeting !== INITIAL_GREETING)
    
    //     throw new Error(`initial greeting not equal, received ${greeting}, expected ${INITIAL_GREETING}`
    // )

    // console.log('Changing greeting...')

    // await setGreeting(vm, accountPk, contractAddressOfCaller, SECOND_GREETING)

    // console.log('State root after set => ', (await vm.stateManager.getStateRoot()).toString('hex'))

    // const greeting2 = await getGreeting(vm, contractAddressOfCaller, accountAddress)

    // console.log('Greeting => ', greeting2)

    // console.log('State root after second getGreeting() (should be the same as before get function call)=> ', (await vm.stateManager.getStateRoot()).toString('hex'))


    // if (greeting2 !== SECOND_GREETING) throw new Error(`second greeting not equal, received ${greeting2}, expected ${SECOND_GREETING}`)


    // const createdContractAccount = await vm.stateManager.getAccount(contractAddressOfCaller)

    // console.log('Account of contract ',createdContractAccount)

    // console.log('State of contract => ',await vm.stateManager.dumpStorage(contractAddressOfCaller))

    // console.log('Contract code => ',await vm.stateManager.getContractCode(contractAddressOfCaller))



}


await main()