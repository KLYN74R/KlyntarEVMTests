import rlp from '@ethereumjs/rlp'

console.log(Buffer.from(rlp.encode('HelloHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTAR KLYNTAR')).toString('hex'))

//Key
//290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563


//Value => Hola, Mundo!
console.log(Buffer.from(rlp.decode('0xa0486f6c612c204d756e646f210000000000000000000000000000000000000018')).toString('utf-8'))


/*

__________________________________More advanced example__________________________________

Contract has greeting = "HelloHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTARHello KLYNTAR KLYNTAR"


State of contract =>  {
  '290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563': '81d1',
  '510e4e770828ddbf7f7b00ab00a9f6adaf81c0dc9cc85f1f8249c256942d61d9': 'a048656c6c6f48656c6c6f204b4c594e54415248656c6c6f204b4c594e54415248',
  '63d75db57ae45c3799740c3cd8dcee96a498324843d79ae390adc81d74b52f13': 'a04c594e54415248656c6c6f204b4c594e54415248656c6c6f204b4c594e544152',
  '68ebfc8da80bd809b12832608f406ef96007b3a567d97edcfc62f0f6f6a6d8fa': 'a0204b4c594e544152000000000000000000000000000000000000000000000000',
  '6c13d8c1c5df666ea9ca2a428504a3776c8ca01021c3a1524ca7d765f600979a': 'a0656c6c6f204b4c594e54415248656c6c6f204b4c594e54415248656c6c6f204b'
}

*/


console.log(Buffer.from(rlp.decode('0x81d1')).length)