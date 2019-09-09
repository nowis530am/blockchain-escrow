import express from "express";
import Web3 from "web3";
var router = express.Router();
import config from "../config";

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// web3
router.get("/purchase_request", async function(req, res, next) {
  let result, address, balance, calculatorContract, escrowContract;
  // if (!req.session.email) {
  //   res.json({ message: "로그인 해주세요." });
  //   return;
  // }

  // geth 연결 확인
  try {
    await web3.eth.net.isListening();
    console.log("connected");
  } catch (e) {
    console.log("Not Connected");
  }

  try {
    address = await web3.eth.getAccounts();
    balance = await web3.utils.fromWei(await web3.eth.getBalance(address[0]), "ether");
    await web3.eth.personal.unlockAccount(address[0], "", 600);
    calculatorContract = new web3.eth.Contract(config.contracts.calculator.ABI, config.contracts.calculator.receiveAddress);
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, config.contracts.escrow.receiveAddress);

    result = await calculatorContract.methods.addition(1, 2).call();
    console.log(result);
    result = await escrowContract.methods.purchase_request().call();
    console.log(result);
    result = await escrowContract.methods.sayHello().call();
    console.log(result);

    // let aacontract = new web3.eth.Contract(calculatorABI);
    result = await escrowContract
      .deploy({
        data: config.contracts.escrow.BYTECODE,
        arguments: [100000] //생성자 params => uint _price 
      })
      .send({
        from: address[0],
        gasPrice: "1000",
        gas: 4700000
      });
    console.log(result._address);
  } catch (e) {
    console.log(e);
  }

  res.status(200).json({
    balance: balance,
    message: "hey"
  });
});

module.exports = router;
