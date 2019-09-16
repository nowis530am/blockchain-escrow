import express from "express";
import Web3 from "web3";
import { Product, User } from "../models";
import config from "../config";
var router = express.Router();

let web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
var subscription = web3.eth.subscribe('pendingTransactions', function(error, result){
  // if (!error)
  //     console.log(result);
})
.on("data", function(transaction){
  console.log("pendingTransaction: " + transaction);
});

// unsubscribes the subscription
// subscription.unsubscribe(function(error, success){
//   if(success)
//       console.log('Successfully unsubscribed!');
// });

// filter.watch(function(error, result){
//   var block = web3.eth.getBlock(result, true);
//   console.log('current block #' + block.number);
// });


// account
router.post("/profile_update", async function(req, res, next) {
  let body, user;
  body = req.body;
  
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  user = await User.findOne({email: req.session.email});
  user.name = body.name;
  user.phone = body.phone;
  user.email = body.email;
  user.address = body.address;
  user.zipCode = body.zipCode;
  await user.save();
  
  // name
  res.json({ message: "업데이트 완료" });
});

router.get("/balance", async function(req, res, next) {
  let body, balance, address, user;

  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  body = req.body;
  user = await User.findOne({email: req.session.email});

  // address = await web3.eth.getAccounts();
  address = user.account.address;
  balance = await web3.utils.fromWei(await web3.eth.getBalance(address), "ether");
  balance = parseFloat(balance).toLocaleString();
  res.json({ balance });
});

router.post("/create_wallet_address", async function(req, res, next) {
  let body, balance, account, user, randomHex, address;
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  body = req.body;
  // account = await web3.eth.accounts.create();
  randomHex = web3.utils.randomHex(32);
  address = await web3.eth.personal.newAccount(randomHex);
  user = await User.findOne({ email: req.session.email });
  // user.walletAddress = account.address;
  user.account = {
    address: address,
    privateKey: randomHex
  };
  await user.save();
  
  // address = await web3.eth.getAccounts();
  // balance = await web3.utils.fromWei(await web3.eth.getBalance(address[0]), "ether");
  
  res.json({ message: "지갑 주소가 생성되었습니다.", address });
});

router.post("/send_money", async function(req, res, next) {
  let body, balance, account, user, result;
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }
  body = req.body;
  user = await User.findOne({ email: req.session.email });

  // console.log(body.toAddress);
  // console.log(user.walletAddress);



  try {
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);

    result = await web3.eth.sendTransaction({
      from: user.account.address,
      to: body.toAddress, 
      value: String(web3.utils.toWei(body.amount, "ether")), 
      gas: 4700000, 
      gasPrice: "1000"
    });
  } catch(e) {
    console.log(e);
    res.json({ message: "오류발생." + e });
    return;
  }
  
  
  res.json({ message: "돈을 보냈습니다." });
});

router.get("/get_transaction_history", async function(req, res, next) {
  let body, balance, account, user, result;
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }
  body = req.body;
  user = await User.findOne({ email: req.session.email });
  console.log(user.account.address);

  try {
    result = await getTransactionsByAccount(user.account.address);
    console.log(result);
    // result = await web3.eth.getPastLogs({fromBlock:'0x0', address:user.account.address})
    // result.forEach(rec => {
    //   console.log(rec.blockNumber, rec.transactionHash, rec.topics);
    // });
  } catch(e) {
    console.log(e);
  }
  
  res.json({ result });
});

async function getTransactionsByAccount(myaccount, startBlockNumber, endBlockNumber) {
  let result = [];
  if (endBlockNumber == null) {
    endBlockNumber = await web3.eth.getBlockNumber();
    console.log("Using endBlockNumber: " + endBlockNumber);
  }
  if (startBlockNumber == null) {
    startBlockNumber = endBlockNumber - 1000;
    console.log("Using startBlockNumber: " + startBlockNumber);
  }
  console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);

  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
    if (i % 1000 == 0) {
      console.log("Searching block " + i);
    }
    var block = await web3.eth.getBlock(i, true);
    if (block != null && block.transactions != null) {
      block.transactions.forEach( function(e) {
        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
          result.push(e);
          console.log("  tx hash          : " + e.hash + "\n"
            + "   nonce           : " + e.nonce + "\n"
            + "   blockHash       : " + e.blockHash + "\n"
            + "   blockNumber     : " + e.blockNumber + "\n"
            + "   transactionIndex: " + e.transactionIndex + "\n"
            + "   from            : " + e.from + "\n" 
            + "   to              : " + e.to + "\n"
            + "   value           : " + e.value + "\n"
            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
            + "   gasPrice        : " + e.gasPrice + "\n"
            + "   gas             : " + e.gas + "\n"
            + "   input           : " + e.input);
        }
      })
    }
  }

  return result;
}

router.post("/product_reg", async function(req, res, next) {
  let body, escrowContract, address, balance, result, user, product;

  // geth 연결 확인
  try {
    await web3.eth.net.isListening();
    console.log("connected");
  } catch (e) {
    console.log("Not Connected");
  }

  try {
    body = req.body;
    if (!req.session.email) {
      res.json({ message: "로그인 해주세요." });
      return;
    }
    user = await User.findOne({ email: req.session.email });
    // address = await web3.eth.getAccounts();
    // address = user.account.address;
    balance = await web3.utils.fromWei(await web3.eth.getBalance(user.account.address), "ether");
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);

    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI);
     result = await escrowContract
      .deploy({
        data: config.contracts.escrow.BYTECODE,
        arguments: [body.price] //생성자 params => uint _price
      })
      .send({
        from: user.account.address,
        gasPrice: "1000",
        gas: 3000000
      });
      // }, function(error, transactionHash){ 
        
      //  })
      // .on('error', function(error){ 
        
      //  })
      // .on('transactionHash', function(transactionHash){ 
        
      //  })
      // .on('receipt', function(receipt){
      //    console.log("contractAddress: "+receipt.contractAddress) // contains the new contract address
      // })
      // .on('confirmation', function(confirmationNumber, receipt){ 
        
      //  })
      // .then(function(newContractInstance){
      //     console.log("newContractInstance: "+newContractInstance.options.address) // instance with the new contract address
      // });
      console.log(result);
      console.log(result._address);
      console.log(result.options.address);
      console.log(result.contractAddress);

    product = new Product();
    console.log('----------------------------' + product._id + "---------------");  
    product.user = req.session._id;
    product.title = body.title;
    product.content = body.content;
    product.price = body.price;
    product.contractAddress = result._address;
    await product.save();
  } catch (e) {
    console.log(e);
    res.json({ message: "에러" });
    return;
  }

  res.json({ message: "등록 완료", _id: product._id });
});
// 물품관련 끝


router.get("/product_details", async function(req, res, next) {
  let body, query, user, result, escrowContract;
  query = req.query;


  
  try {

    // var testSource='contract Test {  function double(int a) constant returns(int) { return 2*a; } }'
    // var testCompiled = await web3.eth.compile.solidity(testSource);
    // console.log(testCompiled);

    user = await User.findOne({ email: req.session.email });

    console.log("---------------------------");
    console.log(query.contractAddress);
    // await web3.eth.personal.unlockAccount(address[0], "", 600);
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, query.contractAddress);
    //query.contractAddress
    //config.contracts.escrow.receiveAddress
    // result = await escrowContract.methods.purchase_request().call();
    // console.log(result);
    result = await escrowContract.methods.sayHello().call();
    console.log(result);
    result = await escrowContract.methods.getNumber().call();
    console.log("number: " + result);
    result = await escrowContract.methods.input_number(112233).call({from: user.account.address});
    console.log(result);
    result = await escrowContract.methods.getNumber().call();
    console.log("number: " + result);
    result = await escrowContract.methods.getPay().call();
    console.log("pay: " + result);
    result = await escrowContract.methods.getPrice().call();
    console.log("price: " + result);
    result = await escrowContract.methods.getState().call();
    console.log("state: " + result);
    result = await escrowContract.methods.purchase_request().call({from: user.account.address});
    console.log(result);
    result = await escrowContract.methods.getState().call();
    console.log("state: " + result);
    console.log("---------------------------");
  } catch(e) {
    console.log(e);
    res.json({ message: e });
    return;
  }
  
  res.json({ message: "등록 완료" });
});

router.post("/purchase_request", function(req, res, next) {
  let body;

  body = req.body;
  
  res.json({ message: "등록 완료" });
});

module.exports = router;
