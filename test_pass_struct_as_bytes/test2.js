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

    //Try to get values like this
    console.log('Encoded via AbiCoder => ',AbiCoder.decode([{
        type:"struct",
        components:[
            {
                internalType: "uint256",
                name: "age",
                type: "uint256"
            },
            {
                internalType: "string",
                name: "name",
                type: "string"
            }
        ]   
    }],encodedUserAsBytes))


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
  
    console.log(JSON.stringify(web3.eth.abi.decodeLog(ABI_FOR_UserDataLogs_LOG,pureHex,topicsInHex)))

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

    return executionResults.execResult.returnValue

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

    // Check if pass by reference works
    console.log('State root by state manager => ',(await stateManager.getStateRoot()).toString('hex'))

    //-------------------- Deploy contract --------------------

    const CONTRACT_BYTECODE = '608060405234801561001057600080fd5b50610726806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80631bf1d2b31461003b57806392c887691461006b575b600080fd5b610055600480360381019061005091906102f0565b610087565b6040516100629190610417565b60405180910390f35b610085600480360381019061008091906104da565b6100e9565b005b61008f610146565b600060405180604001604052808581526020018481525090507fa6e50d761bdb61338a67db0da274978aab7c0a1eee6544b226752f2db6df12af816040516100d79190610417565b60405180910390a18091505092915050565b6000818060200190518101906100ff919061061e565b90507f0314575980cf5cbe29dd535e984b2c50af36decddcad9975554758289c4a04b08160000151826020015160405161013a9291906106c0565b60405180910390a15050565b604051806040016040528060008152602001606081525090565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b61018781610174565b811461019257600080fd5b50565b6000813590506101a48161017e565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101fd826101b4565b810181811067ffffffffffffffff8211171561021c5761021b6101c5565b5b80604052505050565b600061022f610160565b905061023b82826101f4565b919050565b600067ffffffffffffffff82111561025b5761025a6101c5565b5b610264826101b4565b9050602081019050919050565b82818337600083830152505050565b600061029361028e84610240565b610225565b9050828152602081018484840111156102af576102ae6101af565b5b6102ba848285610271565b509392505050565b600082601f8301126102d7576102d66101aa565b5b81356102e7848260208601610280565b91505092915050565b600080604083850312156103075761030661016a565b5b600061031585828601610195565b925050602083013567ffffffffffffffff8111156103365761033561016f565b5b610342858286016102c2565b9150509250929050565b61035581610174565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561039557808201518184015260208101905061037a565b60008484015250505050565b60006103ac8261035b565b6103b68185610366565b93506103c6818560208601610377565b6103cf816101b4565b840191505092915050565b60006040830160008301516103f2600086018261034c565b506020830151848203602086015261040a82826103a1565b9150508091505092915050565b6000602082019050818103600083015261043181846103da565b905092915050565b600067ffffffffffffffff821115610454576104536101c5565b5b61045d826101b4565b9050602081019050919050565b600061047d61047884610439565b610225565b905082815260208101848484011115610499576104986101af565b5b6104a4848285610271565b509392505050565b600082601f8301126104c1576104c06101aa565b5b81356104d184826020860161046a565b91505092915050565b6000602082840312156104f0576104ef61016a565b5b600082013567ffffffffffffffff81111561050e5761050d61016f565b5b61051a848285016104ac565b91505092915050565b600080fd5b600080fd5b60008151905061053c8161017e565b92915050565b600061055561055084610240565b610225565b905082815260208101848484011115610571576105706101af565b5b61057c848285610377565b509392505050565b600082601f830112610599576105986101aa565b5b81516105a9848260208601610542565b91505092915050565b6000604082840312156105c8576105c7610523565b5b6105d26040610225565b905060006105e28482850161052d565b600083015250602082015167ffffffffffffffff81111561060657610605610528565b5b61061284828501610584565b60208301525092915050565b6000602082840312156106345761063361016a565b5b600082015167ffffffffffffffff8111156106525761065161016f565b5b61065e848285016105b2565b91505092915050565b61067081610174565b82525050565b600082825260208201905092915050565b60006106928261035b565b61069c8185610676565b93506106ac818560208601610377565b6106b5816101b4565b840191505092915050565b60006040820190506106d56000830185610667565b81810360208301526106e78184610687565b9050939250505056fea2646970667358221220a873207fcf19b06b76ae61f629d1dc5f493d4b223d541a8d85d9fdb606d507c964736f6c63430008110033'

    console.log('Deploying the contract...')
   

    const contractAddress = await deployContract(vm,accountPk,CONTRACT_BYTECODE)

    console.log('Contract address => ', contractAddress.toString())

    console.log('State root after deployment contract => ', (await vm.stateManager.getStateRoot()).toString('hex'))

    console.log('Account of contract ',await vm.stateManager.getAccount(contractAddress))


    let encodedUser = await callCreateUserAndEncode(vm,accountPk,contractAddress,'Vlad Chernenko',20);

    await createUserFromBytes(vm,accountPk,contractAddress,encodedUser);


}


await main()