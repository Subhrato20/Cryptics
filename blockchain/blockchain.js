const hash = require('object-hash');

class blockChain{
  constructor(){
    this.chain = [];
    this.curr_transaction = [];
  }
  addNewBlock(prevHash){
    let block = {
      index: this.chain.length +1,
      timestamp: this.curr_transaction,
     
      prevHash: prevHash,
    };
    //put hash
    this.hash = hash(block);

    //Add to BlockChain
    this.chain.push(block);
    this.curr_transaction=[];
    return block;
  }
  addNewTransaction(sender){
    this.curr_transaction.push({sender});
  }
  lastBlock(){
    return this.chain.slice(-1)[0];
  }
  isEmpty(){
    return this.chain.length ==0;
  }


}

module.exports = blockChain
