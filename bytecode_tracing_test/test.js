import {getAccountNonce,insertAccount} from '../helpers/account-utils.js'
import {buildTransaction,encodeFunction} from '../helpers/tx-builder.js'
import {defaultAbiCoder as AbiCoder,Interface} from '@ethersproject/abi'
import {DefaultStateManager} from '@ethereumjs/statemanager'
import {Chain,Common,Hardfork} from '@ethereumjs/common'
import {Transaction} from '@ethereumjs/tx'
import {Address} from '@ethereumjs/util'
import {Block} from '@ethereumjs/block'
import {Trie} from '@ethereumjs/trie'
import {LevelDB} from '../LevelDB.js'
import {VM} from '@ethereumjs/vm'
import {Level} from 'level'



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

    console.log('DATA WHEN testCallFoo() ',data)

    const txData = {
        to: callerContractAddress,
        data,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

    const setGreetingResult = await vm.runTx({ tx, block })

    console.log('testCallFoo() => Gas used:',setGreetingResult.execResult.executionGasUsed.toString())

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


    // Create the VM instance
    const vm = await VM.create({common,stateManager})
  
  
    //-------------------- Put initial account --------------------

    console.log('Account => ', accountAddress.toString())

    await insertAccount(vm,accountAddress)
  
    console.log('The most init state root => ',(await vm.stateManager.getStateRoot()).toString('hex'))


    //-------------------- Deploy contracts --------------------

    const CALLER_CONTRACT_BYTECODE = '608060405234801561001057600080fd5b5061058d806100206000396000f3fe6080604052600436106100295760003560e01c806387ba61791461002e578063ff00726c1461004a575b600080fd5b610048600480360381019061004391906102ec565b610066565b005b610064600480360381019061005f91906102ec565b6101a7565b005b6000808273ffffffffffffffffffffffffffffffffffffffff163461138890607b604051602401610097919061040b565b6040516020818303038152906040527f24ccab8f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405161012191906103c4565b600060405180830381858888f193505050503d806000811461015f576040519150601f19603f3d011682016040523d82523d6000602084013e610164565b606091505b50915091507f13848c3e38f8886f3f5d2ad9dff80d8092c2bbb8efd5b887a99c2c6cfc09ac2a828260405161019a9291906103db565b60405180910390a1505050565b6000808273ffffffffffffffffffffffffffffffffffffffff16346040516024016040516020818303038152906040527f1dcc85ae000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405161025291906103c4565b60006040518083038185875af1925050503d806000811461028f576040519150601f19603f3d011682016040523d82523d6000602084013e610294565b606091505b50915091507f13848c3e38f8886f3f5d2ad9dff80d8092c2bbb8efd5b887a99c2c6cfc09ac2a82826040516102ca9291906103db565b60405180910390a1505050565b6000813590506102e681610540565b92915050565b60006020828403121561030257610301610501565b5b6000610310848285016102d7565b91505092915050565b61032281610483565b82525050565b600061033382610439565b61033d8185610444565b935061034d8185602086016104ce565b61035681610506565b840191505092915050565b600061036c82610439565b6103768185610455565b93506103868185602086016104ce565b80840191505092915050565b61039b816104bc565b82525050565b60006103ae600883610460565b91506103b982610517565b602082019050919050565b60006103d08284610361565b915081905092915050565b60006040820190506103f06000830185610319565b81810360208301526104028184610328565b90509392505050565b60006040820190508181036000830152610424816103a1565b90506104336020830184610392565b92915050565b600081519050919050565b600082825260208201905092915050565b600081905092915050565b600082825260208201905092915050565b600061047c8261048f565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600060ff82169050919050565b60006104c7826104af565b9050919050565b60005b838110156104ec5780820151818401526020810190506104d1565b838111156104fb576000848401525b50505050565b600080fd5b6000601f19601f8301169050919050565b7f63616c6c20666f6f000000000000000000000000000000000000000000000000600082015250565b61054981610471565b811461055457600080fd5b5056fea2646970667358221220aa0d72a8737e79bd73927a4d603c327bb75807ac0a9919549d027f6980ab88d464736f6c63430008070033'

    const RECEIVED_CONTRACT_BYTECODE = '608060405234801561001057600080fd5b50610540806100206000396000f3fe6080604052600436106100225760003560e01c806324ccab8f1461005e57610023565b5b7f59e04c3f0d44b7caf6e8ef854b61d9a51cf1960d7a88ff6356cc5e946b4b58323334604051610054929190610279565b60405180910390a1005b61007860048036038101906100739190610165565b61008e565b60405161008591906102b5565b60405180910390f35b60007f59e04c3f0d44b7caf6e8ef854b61d9a51cf1960d7a88ff6356cc5e946b4b58323334856040516100c39392919061023b565b60405180910390a16001826100d89190610342565b905092915050565b60006100f36100ee846102f5565b6102d0565b90508281526020810184848401111561010f5761010e6104aa565b5b61011a8482856103d4565b509392505050565b600082601f830112610137576101366104a5565b5b81356101478482602086016100e0565b91505092915050565b60008135905061015f816104f3565b92915050565b6000806040838503121561017c5761017b6104b4565b5b600083013567ffffffffffffffff81111561019a576101996104af565b5b6101a685828601610122565b92505060206101b785828601610150565b9150509250929050565b6101ca81610398565b82525050565b60006101db82610326565b6101e58185610331565b93506101f58185602086016103e3565b6101fe816104b9565b840191505092915050565b6000610216601383610331565b9150610221826104ca565b602082019050919050565b610235816103ca565b82525050565b600060608201905061025060008301866101c1565b61025d602083018561022c565b818103604083015261026f81846101d0565b9050949350505050565b600060608201905061028e60008301856101c1565b61029b602083018461022c565b81810360408301526102ac81610209565b90509392505050565b60006020820190506102ca600083018461022c565b92915050565b60006102da6102eb565b90506102e68282610416565b919050565b6000604051905090565b600067ffffffffffffffff8211156103105761030f610476565b5b610319826104b9565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b600061034d826103ca565b9150610358836103ca565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561038d5761038c610447565b5b828201905092915050565b60006103a3826103aa565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b82818337600083830152505050565b60005b838110156104015780820151818401526020810190506103e6565b83811115610410576000848401525b50505050565b61041f826104b9565b810181811067ffffffffffffffff8211171561043e5761043d610476565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f46616c6c6261636b207761732063616c6c656400000000000000000000000000600082015250565b6104fc816103ca565b811461050757600080fd5b5056fea2646970667358221220f4cb8e0bed78c4c6fb9844c17c3af08561344bc3572cafcc1be04a57a043136d64736f6c63430008070033'


    console.log('Deploying the contracts...')
   

    const contractAddressOfCaller = await deployContract(vm,accountPk,CALLER_CONTRACT_BYTECODE)

    const contractAddressOfReceiver = await deployContract(vm,accountPk,RECEIVED_CONTRACT_BYTECODE)


    console.log('Caller contract address => ', contractAddressOfCaller.toString())

    console.log('Receiver contract address => ', contractAddressOfReceiver.toString())


    console.log('State root after deployment 2 contracts => ', (await vm.stateManager.getStateRoot()).toString('hex'))


    console.log('EOA account of caller contract ',await vm.stateManager.getAccount(contractAddressOfCaller))

    console.log('EOA account of receiver contract ',await vm.stateManager.getAccount(contractAddressOfReceiver))


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

    // console.log('EOA account of contract ',createdContractAccount)

    // console.log('State of contract => ',await vm.stateManager.dumpStorage(contractAddressOfCaller))

    // console.log('Contract code => ',await vm.stateManager.getContractCode(contractAddressOfCaller))



}


await main()