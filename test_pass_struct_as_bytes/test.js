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




async function createUserFromBytes(vm,senderPrivateKey,contractAddress,encodedUserAsBytes) {

    const data = encodeFunction('createUserFromBytes',{
    
        types: ['bytes'],
        values: [encodedUserAsBytes],
    
    })

    
    console.log('DATA WHEN createUserFromBytes() ',data)

    const txData = {
        to: contractAddress,
        data,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

    const executionResults = await vm.runTx({ tx, block })

    console.log('Gas used:',executionResults.execResult.executionGasUsed.toString())

    console.log('Try to get logs from contract')

    let logs = executionResults.execResult.logs[0]

    let ABI_FOR_UserDataLogs_LOG = [
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "age",
            "type": "uint256"
        },
        {
            "indexed": false,
            "internalType": "string",
            "name": "name",
            "type": "string"
        }
    ]
    
    
    console.log(logs)

    // Decode logs

    let pureHex = '0x'+logs[2].toString('hex'), topicsInHex = logs[1].map(x=>'0x'+x.toString('hex'))

    console.log('Contract address of logs is => ','0x'+logs[0].toString('hex'))
  
    console.log(web3.eth.abi.decodeLog(ABI_FOR_UserDataLogs_LOG,pureHex,topicsInHex))

}




async function callCreateUserAndEncode(vm,senderPrivateKey,contractAddress,userName,userAge) {

    const data = encodeFunction('createUserAndEncode',{
    
        types: ['uint256','string'],
        values: [userAge,userName],
    
    })

    
    console.log('DATA WHEN createUserAndEncode() ',data)

    const txData = {
        to: contractAddress,
        data,
        nonce: await getAccountNonce(vm, senderPrivateKey),
    }

    const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(senderPrivateKey)

    const executionResults = await vm.runTx({ tx, block })

    console.log('Gas used:',executionResults.execResult.executionGasUsed.toString())

    console.log('Try to get logs from contract')

    let logs = executionResults.execResult.logs[0]

    let ABI_FOR_CHECKUSER_LOG = [
        {
            "components": [
                {
                    "internalType": "uint256",
                    "name": "age",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                }
            ],
            "indexed": false,
            "internalType": "struct InitTest.User",
            "name": "",
            "type": "tuple"
        }
    ]
    
    console.log(logs)

    // Decode logs
    console.log('Logs size is ',logs[2].length)

    let pureHex = '0x'+logs[2].toString('hex'), topicsInHex = logs[1].map(x=>'0x'+x.toString('hex'))

    console.log('Purehex is => ',pureHex)

    console.log('Contract address of logs is => ','0x'+logs[0].toString('hex'))
  
    console.log(web3.eth.abi.decodeLog(ABI_FOR_CHECKUSER_LOG,pureHex,topicsInHex))

    console.log(`Returned value is(it's encoded user) => `,executionResults.execResult.returnValue.toString('hex'))

    // return executionResults.execResult.returnValue

    return pureHex

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


    //-------------------- Deploy contrac --------------------

    const CONTRACT_BYTECODE = '608060405234801561001057600080fd5b506107a2806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80631bf1d2b31461003b57806392c887691461006b575b600080fd5b610055600480360381019061005091906102f5565b610087565b60405161006291906103d0565b60405180910390f35b61008560048036038101906100809190610493565b610108565b005b6060600060405180604001604052808581526020018481525090506000816040516020016100b5919061057d565b60405160208183030381529060405290507fa6e50d761bdb61338a67db0da274978aab7c0a1eee6544b226752f2db6df12af826040516100f5919061057d565b60405180910390a1809250505092915050565b60008180602001905181019061011e919061069a565b90507f0314575980cf5cbe29dd535e984b2c50af36decddcad9975554758289c4a04b08160000151826020015160405161015992919061073c565b60405180910390a15050565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b61018c81610179565b811461019757600080fd5b50565b6000813590506101a981610183565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610202826101b9565b810181811067ffffffffffffffff82111715610221576102206101ca565b5b80604052505050565b6000610234610165565b905061024082826101f9565b919050565b600067ffffffffffffffff8211156102605761025f6101ca565b5b610269826101b9565b9050602081019050919050565b82818337600083830152505050565b600061029861029384610245565b61022a565b9050828152602081018484840111156102b4576102b36101b4565b5b6102bf848285610276565b509392505050565b600082601f8301126102dc576102db6101af565b5b81356102ec848260208601610285565b91505092915050565b6000806040838503121561030c5761030b61016f565b5b600061031a8582860161019a565b925050602083013567ffffffffffffffff81111561033b5761033a610174565b5b610347858286016102c7565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561038b578082015181840152602081019050610370565b60008484015250505050565b60006103a282610351565b6103ac818561035c565b93506103bc81856020860161036d565b6103c5816101b9565b840191505092915050565b600060208201905081810360008301526103ea8184610397565b905092915050565b600067ffffffffffffffff82111561040d5761040c6101ca565b5b610416826101b9565b9050602081019050919050565b6000610436610431846103f2565b61022a565b905082815260208101848484011115610452576104516101b4565b5b61045d848285610276565b509392505050565b600082601f83011261047a576104796101af565b5b813561048a848260208601610423565b91505092915050565b6000602082840312156104a9576104a861016f565b5b600082013567ffffffffffffffff8111156104c7576104c6610174565b5b6104d384828501610465565b91505092915050565b6104e581610179565b82525050565b600081519050919050565b600082825260208201905092915050565b6000610512826104eb565b61051c81856104f6565b935061052c81856020860161036d565b610535816101b9565b840191505092915050565b600060408301600083015161055860008601826104dc565b50602083015184820360208601526105708282610507565b9150508091505092915050565b600060208201905081810360008301526105978184610540565b905092915050565b600080fd5b600080fd5b6000815190506105b881610183565b92915050565b60006105d16105cc84610245565b61022a565b9050828152602081018484840111156105ed576105ec6101b4565b5b6105f884828561036d565b509392505050565b600082601f830112610615576106146101af565b5b81516106258482602086016105be565b91505092915050565b6000604082840312156106445761064361059f565b5b61064e604061022a565b9050600061065e848285016105a9565b600083015250602082015167ffffffffffffffff811115610682576106816105a4565b5b61068e84828501610600565b60208301525092915050565b6000602082840312156106b0576106af61016f565b5b600082015167ffffffffffffffff8111156106ce576106cd610174565b5b6106da8482850161062e565b91505092915050565b6106ec81610179565b82525050565b600082825260208201905092915050565b600061070e826104eb565b61071881856106f2565b935061072881856020860161036d565b610731816101b9565b840191505092915050565b600060408201905061075160008301856106e3565b81810360208301526107638184610703565b9050939250505056fea2646970667358221220fd063901aef6fd64079eeea244786295cee5d53449180e8382276834bce8806164736f6c63430008110033'

    console.log('Deploying the contract...')
   

    const contractAddress = await deployContract(vm,accountPk,CONTRACT_BYTECODE)

    console.log('Contract address => ', contractAddress.toString())


    console.log('State root after deployment contract => ', (await vm.stateManager.getStateRoot()).toString('hex'))

    console.log('EOA account of contract ',await vm.stateManager.getAccount(contractAddress))

    let encodedUser = await callCreateUserAndEncode(vm,accountPk,contractAddress,'Vlad Chernenko',20);

    await createUserFromBytes(vm,accountPk,contractAddress,encodedUser);


}


await main()