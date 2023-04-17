import { Interface, defaultAbiCoder as AbiCoder } from '@ethersproject/abi'


export const encodeFunction = (method,params) => {

  const parameters = params.types ?? []
  const methodWithParameters = `function ${method}(${parameters.join(',')})`
  const signatureHash = new Interface([methodWithParameters]).getSighash(method)
  const encodedArgs = AbiCoder.encode(parameters, params?.values ?? [])

  return signatureHash + encodedArgs.slice(2)

}

export const encodeDeployment = (bytecode,params) => {
  
    const deploymentData = '0x' + bytecode
    if (params) {
        const argumentsEncoded = AbiCoder.encode(params.types, params.values)
        return deploymentData + argumentsEncoded.slice(2)
    }
    return deploymentData
}

export const buildTransaction = (data) => {

  const defaultData = {
    nonce: BigInt(0),
    gasLimit: 2_000_000, // We assume that 2M is enough,
    gasPrice: 1,
    value: 0,
    data: '0x',
  }

  return {
    ...defaultData,
    ...data,
  }
}