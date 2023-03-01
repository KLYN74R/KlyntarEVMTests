import rlp from '@ethereumjs/rlp'

// console.log(Buffer.from(rlp.encode('HelloHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTAR KLYNTAR')).toString('hex'))

//Key
//290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563


//Value => Hola, Mundo!
console.log(Buffer.from(rlp.decode('0xa0486f6c612c204d756e646f210000000000000000000000000000000000000018')).toString('utf-8'))