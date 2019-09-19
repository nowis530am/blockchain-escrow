import express from "express";
import Web3 from "web3";
import { Product, User, Transaction } from "../models";
import config from "../config";
import multer from "multer";
const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "public/uploads/");
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
  })
});
var router = express.Router();

//web3 provider를 통해 연결
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
// geth 연결 확인
web3.eth.net
  .isListening()
  .then(() => console.log("web3 connected"))
  .catch(e => console.log("web3 not connected "));

var subscription = web3.eth
  .subscribe("pendingTransactions", function(error, result) {
    // if (!error)
    //     console.log(result);
  })
  .on("data", function(transaction) {
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
router.post("/profile_update", upload.fields([{ name: "image" }]), async function(req, res, next) {
  let body, user;
  body = req.body;

  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  user = await User.findOne({ email: req.session.email });
  user.name = body.name;
  user.phone = body.phone;
  user.email = body.email;
  user.address = body.address;
  user.zipCode = body.zipCode;
  if (req.files.image) {
    user.profileImagePath = "/uploads/" + req.files.image[0].filename;
  }
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
  user = await User.findOne({ email: req.session.email });

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
  randomHex = web3.utils.randomHex(32);
  address = await web3.eth.personal.newAccount(randomHex);
  user = await User.findOne({ email: req.session.email });
  user.account = {
    address: address,
    privateKey: randomHex
  };
  await user.save();

  // account = await web3.eth.accounts.create();
  // user.walletAddress = account.address;
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

  try {
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);

    result = await web3.eth.sendTransaction({
      from: user.account.address,
      to: body.toAddress,
      value: String(web3.utils.toWei(body.amount, "ether")),
      gas: 4700000,
      gasPrice: "1000"
    });
  } catch (e) {
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
  } catch (e) {
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
  console.log(
    'Searching for transactions to/from account "' +
      myaccount +
      '" within blocks ' +
      startBlockNumber +
      " and " +
      endBlockNumber
  );

  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
    if (i % 1000 == 0) {
      console.log("Searching block " + i);
    }
    var block = await web3.eth.getBlock(i, true);
    if (block != null && block.transactions != null) {
      block.transactions.forEach(function(e) {
        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
          result.push(e);
          console.log(
            "  tx hash          : " +
              e.hash +
              "\n" +
              "   nonce           : " +
              e.nonce +
              "\n" +
              "   blockHash       : " +
              e.blockHash +
              "\n" +
              "   blockNumber     : " +
              e.blockNumber +
              "\n" +
              "   transactionIndex: " +
              e.transactionIndex +
              "\n" +
              "   from            : " +
              e.from +
              "\n" +
              "   to              : " +
              e.to +
              "\n" +
              "   value           : " +
              e.value +
              "\n" +
              "   time            : " +
              block.timestamp +
              " " +
              new Date(block.timestamp * 1000).toGMTString() +
              "\n" +
              "   gasPrice        : " +
              e.gasPrice +
              "\n" +
              "   gas             : " +
              e.gas +
              "\n" +
              "   input           : " +
              e.input
          );
        }
      });
    }
  }

  return result;
}

/**
 * 물품 등록
 */

router.post("/product_reg", upload.fields([{ name: "image" }]), async function(req, res, next) {
  let body, escrowContract, address, balance, result, user, product, transaction;

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
    console.log(result);
    console.log(result._address);
    console.log(result.options.address);
    console.log(result.contractAddress);
    console.log(req.files);

    //
    product = new Product();
    product.user = req.session._id;
    product.title = body.title;
    product.content = body.content;
    product.price = body.price;
    product.contractAddress = result._address;
    if (req.files.image) {
      product.images = req.files.image.map(item => {
        return "/uploads/" + item.filename;
      });
    }
    await product.save();

    transaction = new Transaction();
    transaction.seller = user._id;
    transaction.product = product._id;
    await transaction.save();
  } catch (e) {
    console.log(e);
    res.json({ message: "에러, 잔액이 충분한지 확인해주세요." });
    return;
  }

  res.json({ message: "등록 완료", _id: product._id });
});
// 물품관련 끝

// router.get("/product_details", async function(req, res, next) {
//   let body, query, user, result, escrowContract;
//   query = req.query;

//   try {
//     // var testSource='contract Test {  function double(int a) constant returns(int) { return 2*a; } }'
//     // var testCompiled = await web3.eth.compile.solidity(testSource);
//     // console.log(testCompiled);

//     user = await User.findOne({ email: req.session.email });

//     console.log("---------------------------");
//     console.log(query.contractAddress);
//     // await web3.eth.personal.unlockAccount(address[0], "", 600);
//     escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, query.contractAddress);
//     //query.contractAddress
//     //config.contracts.escrow.receiveAddress
//     // result = await escrowContract.methods.purchase_request().call();
//     // console.log(result);
//     result = await escrowContract.methods.sayHello().call();
//     console.log(result);
//     result = await escrowContract.methods.getNumber().call();
//     console.log("number: " + result);
//     result = await escrowContract.methods.input_number(112233).call({ from: user.account.address });
//     console.log(result);
//     result = await escrowContract.methods.getNumber().call();
//     console.log("number: " + result);
//     result = await escrowContract.methods.getPay().call();
//     console.log("pay: " + result);
//     result = await escrowContract.methods.getPrice().call();
//     console.log("price: " + result);
//     result = await escrowContract.methods.getState().call();
//     console.log("state: " + result);
//     // result = await escrowContract.methods.purchase_request().call({ from: user.account.address });
//     // console.log(result);
//     result = await escrowContract.methods.getState().call();
//     console.log("state: " + result);
//     console.log("---------------------------");
//   } catch (e) {
//     console.log(e);
//     res.json({ message: String(e) });
//     return;
//   }

//   res.json({ message: "등록 완료" });
// });

/**
 * 물품 구매요청하기
 */
router.post("/purchase_request", async function(req, res, next) {
  // 변수들 미리 세팅
  let result, buyer, seller, escrowContract, transaction, body, product, address, balance;
  body = req.body;

  // 로그인 되었는지 체크
  if (!req.session.email) {
    res.json({ success: false, message: "로그인 해주세요." });
    return;
  }

  try {
    // DB에서 정보 미리 읽어옴
    buyer = await User.findOne({ email: req.session.email });
    seller = await User.findOne({ _id: body.seller });
    product = await Product.findOne({ _id: body.productId });
    transaction = await Transaction.findOne({ product: body.productId });

    // 지갑 주소 생성 안했으면 취소
    if (!buyer.account || !buyer.account.address) {
      res.json({ success: false, message: "지갑 주소를 먼저 생성해주세요." });
      return;
    }

    // 이미 구매요청을 한 기록이 있으면 취소
    let checkTransaction = await Transaction.findOne({ product: body.productId, buyer: buyer._id });
    if (checkTransaction) {
      res.json({ success: false, message: "이미 구입요청을 보내었습니다." });
      return;
    }

    // 잔액조회
    balance = await web3.utils.fromWei(await web3.eth.getBalance(buyer.account.address), "ether");
    if (balance < (product.price * 2)) {
      res.json({ success: false, message: "잔액이 부족합니다. (물품금액 * 2) 만큼의 돈이 필요합니다." });
      return;
    }

    // 계정잠금해제
    await web3.eth.personal.unlockAccount(buyer.account.address, buyer.account.privateKey, 600);
    // 물품의 스마트 컨트랙트
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, body.contractAddress);

    // 구매요청함수 호출
    result = await escrowContract.methods.purchase_request().send({
      from: buyer.account.address,
      value: product.price * 2
    });

    console.log(result);

    // 여기서부터 구입요청 성공
    // 물품 거래내역 db에 구매자를 할당
    transaction.buyer = buyer._id;
    // 물품 상태 구매중으로 변경
    transaction.state = "processing";
    await transaction.save();

    // 결과 response
    res.json({
      success: true,
      message: "구입요청이 승인되었습니다."
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: true,
      message: "에러발생: " + e
    });
  }
});

module.exports = router;
