import express from "express";
import Web3 from "web3";
import { Product } from "../models";
import config from "../config";
var router = express.Router();

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// index page
router.get("/", function(req, res, next) {
  res.locals = {
    title: "[Project]NOW IS 05:30 AM - 중고거래 메인",
    req: req
  };

  res.render("index", { req });
});

router.post("/product_reg", async function(req, res, next) {
  let body, escrowContract, address, balance, result;

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
    address = await web3.eth.getAccounts();
    balance = await web3.utils.fromWei(await web3.eth.getBalance(address[0]), "ether");
    await web3.eth.personal.unlockAccount(address[0], "", 600);

    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, config.contracts.escrow.receiveAddress);
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

    let product = new Product();
    product.user = req.session._id;
    product.title = body.title;
    product.content = body.content;
    product.price = body.price;
    product.contractAddress = result._address;
    await product.save();
  } catch (e) {
    console.log(e);
  }

  res.json({ message: "등록 완료" });
});
// 물품관련 끝

router.post("/purchase_request", function(req, res, next) {
  let body;

  body = req.body;
  
  res.json({ message: "등록 완료" });
});

module.exports = router;
