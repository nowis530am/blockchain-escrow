import express from "express";
import Web3 from "web3";
import { Product, User, Transaction, BlockTransaction } from "../models";
import config from "../config";
import multer from "multer";

/**
 * 이미지 업로드 설정
 */
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

/**
 * 라우터
 */
var router = express.Router();

/**
 * WEB3
 */
// WebSocketProvider로 연결
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
// geth 연결 확인
web3.eth.net
  .isListening()
  .then(() => console.log("web3 connected"))
  .catch(e => console.log("web3 not connected "));
// 신규 트랜잭션 발생 이벤트 geth에서 받기
var subscription = web3.eth
  .subscribe("pendingTransactions", function(error, result) {
    if (error) console.log(error);
  })
  .on("data", async function(txId) {
    // console.log("pendingTransaction: " + txId);
    // console.log(transaction);
    let transaction = await web3.eth.getTransaction(txId);
    let blockTransaction = new BlockTransaction();
    blockTransaction.hash = transaction.hash;
    blockTransaction.from = transaction.from;
    blockTransaction.to = transaction.to;
    blockTransaction.value = transaction.value;
    await blockTransaction.save();
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

/**
 * 프로필 업데이트 
 */
router.post("/profile_update", upload.fields([{ name: "image" }]), async function(req, res, next) {
  // 변수 미리 설정
  let body, user;
  body = req.body;

  // 로그인 여부 확인
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  // 데이터 업데이트
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

  // response
  res.json({ message: "업데이트 완료" });
});

/**
 * 잔액 확인
 */
router.get("/balance", async function(req, res, next) {
  // 변수 미리 설정
  let body, balance, address, user;
  body = req.body;

  // 로그인 여부 확인
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  // 로그인된 유저 지갑 주소 가져오기
  user = await User.findOne({ email: req.session.email });
  address = user.account.address;
  // 잔액가져오기. 단위: ether
  balance = await web3.utils.fromWei(await web3.eth.getBalance(address), "ether");
  // 000 세개 마다 , 찍기
  balance = parseFloat(balance).toLocaleString();

  // response
  res.json({ balance });
});

/**
 * 신규 지갑 주소 생성
 */
router.post("/create_wallet_address", async function(req, res, next) {
  // 변수 미리 세팅
  let body, balance, account, user, randomHex, address;
  body = req.body;

  // 로그인 여부 확인
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  // privateKey로 사용할 32자리 랜덤 Hex값 생성
  randomHex = web3.utils.randomHex(32);
  // 비밀번호를 토대로 지갑 주소 생성
  address = await web3.eth.personal.newAccount(randomHex);
  // DB에 지갑주소 업데이트
  user = await User.findOne({ email: req.session.email });
  user.account = {
    address: address,
    privateKey: randomHex
  };
  await user.save();

  // response
  res.json({ message: "지갑 주소가 생성되었습니다.", address });
});

/**
 * 지갑간에 돈 보내기
 */
router.post("/send_money", async function(req, res, next) {
  // 변수 미리 세팅
  let body, balance, account, user, result;
  body = req.body;

  // 로그인 여부 확인
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  try {
    user = await User.findOne({ email: req.session.email });

    // 계정 lock 해제
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);

    // ether 전송
    result = await web3.eth.sendTransaction({
      from: user.account.address,
      to: body.toAddress,
      value: String(web3.utils.toWei(body.amount, "ether")),
      gas: 4700000,
      gasPrice: "1000"
    });

    // response
    res.json({ message: "돈을 보냈습니다." });
  } catch (e) {
    console.log(e);
    res.json({ message: "오류발생: " + e });
    return;
  }
});

/**
 * 블록체인에서 트랜잭션 기록 가져오기
 */
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
    result = await BlockTransaction.find({
      $or: [
        {
          from: {
            $regex: user.account.address,
            $options: "i"
          }
        },
        {
          to: {
            $regex: user.account.address,
            $options: "i"
          }
        }
      ]
    }).sort({ createdAt: -1 });

    const mappingFunction = result => {
      const promises = result.map(async item => {
        item.value = web3.utils.fromWei(item.value, "ether");
        if ("0" == item.value) {
          return;
        }
        //출금
        if (user.account.address == item.to) {
          item.user = await User.findOne({
            "account.address": item.from
          });
          //입금
        } else {
          item.user = await User.findOne({
            "account.address": item.to
          });
        }
        return item;
      });
      return Promise.all(promises);
    };

    result = await mappingFunction(result);
    // result = await getTransactionsByAccount(user.account.address);
    // console.log(result);
    // result = await web3.eth.getPastLogs({fromBlock:'0x0', address:user.account.address})
    // result.forEach(rec => {
    //   console.log(rec.blockNumber, rec.transactionHash, rec.topics);
    // });
    res.json({ result });
  } catch (e) {
    console.log(e);
    res.json({ message: "오류발생: " + e });
    return;
  }
});

// 블록 검색하여 입출금 트랜잭션 가져오기
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
    let product, user;
    if (i % 1000 == 0) {
      console.log("Searching block " + i);
    }
    var block = await web3.eth.getBlock(i, true);
    if (block != null && block.transactions != null) {
      await block.transactions.forEach(async function(e) {
        // console.log(e.from + " - " + myaccount);
        if (myaccount == "*" || myaccount == e.from.toLowerCase() || myaccount == e.to.toLowerCase()) {
          if (e.value == 0) {
            //스마트 컨트랙트
            product = await Product.findOne({ contractAddress: e.to }).populate("user");
            e.product = product;
            if (!product) return;
          } else {
            //입출금
            e.fromUser = await User.findOne({ _id: e.from });
            e.toUser = await User.findOne({ _id: e.to });
          }

          e.value = web3.utils.fromWei(e.value, "ether");
          result.push(e);
          console.log(e);
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
  // 변수 미리 설정
  let body, escrowContract, address, balance, result, user, product, transaction;
  body = req.body;

  try {
    // 판매자 로그인 확인
    if (!req.session.email) {
      res.json({ message: "로그인 해주세요." });
      return;
    }

    // DB에서 미리 데이터 뽑아오기
    user = await User.findOne({ email: req.session.email });
    balance = await web3.utils.fromWei(await web3.eth.getBalance(user.account.address), "ether");
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);

    // 물품 등록과 동시에 컨트랙트 deploy
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI);
    result = await escrowContract
      .deploy({
        data: config.contracts.escrow.BYTECODE,
        arguments: [web3.utils.toWei(String(body.price), "ether")] //생성자 params => uint _price
      })
      .send({
        from: user.account.address,
        gasPrice: "1000",
        gas: 3000000
      });

    // 컨트랙트 등록이 완료되면 DB에 물품정보 등록
    product = new Product();
    product.user = req.session._id;
    product.title = body.title;
    product.content = body.content;
    product.price = body.price;
    product.contractAddress = result._address;
    // 이미지 파일 업로드
    if (req.files.image) {
      product.images = req.files.image.map(item => {
        return "/uploads/" + item.filename;
      });
    }
    await product.save();

    // 거래내역 DB에 등록
    transaction = new Transaction();
    transaction.seller = user._id;
    transaction.product = product._id;
    await transaction.save();

    // response
    res.json({ message: "등록 완료", _id: product._id });
  } catch (e) {
    console.log(e);
    res.json({ message: "에러: " + e });
    return;
  }
});

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
    let checkTransaction = await Transaction.findOne({
      product: body.productId,
      buyer: buyer._id
    });
    if (checkTransaction) {
      res.json({ success: false, message: "이미 구입요청을 보내었습니다." });
      return;
    }

    // 잔액조회
    balance = await web3.utils.fromWei(await web3.eth.getBalance(buyer.account.address), "ether");
    if (balance < product.price * 2) {
      res.json({
        success: false,
        message: "잔액이 부족합니다. (물품금액 * 2) 만큼의 돈이 필요합니다."
      });
      return;
    }

    // 계정잠금해제
    await web3.eth.personal.unlockAccount(buyer.account.address, buyer.account.privateKey, 600);
    // 물품의 스마트 컨트랙트
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, body.contractAddress);

    // 구매요청함수 호출
    result = await escrowContract.methods.purchase_request().send({
      from: buyer.account.address,
      value: web3.utils.toWei(String(product.price * 2), "ether")
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

/**
 * 판매자 운송장 입력
 */
router.post("/input_number", async function(req, res, next) {
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
    product = await Product.findOne({ _id: body.productId });
    seller = await User.findOne({ _id: product.user });
    transaction = await Transaction.findOne({ product: body.productId });

    console.log(seller);
    // 계정잠금해제
    await web3.eth.personal.unlockAccount(seller.account.address, seller.account.privateKey, 600);
    // 물품의 스마트 컨트랙트
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, product.contractAddress);

    // 운송장 입력 함수 호출
    result = await escrowContract.methods.input_number(body.inputNumber).send({
      from: seller.account.address
    });

    console.log(result);

    // 여기서부터 운송장 입력 성공
    // 물품 거래내역 db 업데이트
    transaction.inputNumber = body.inputNumber;
    // 물품 상태 구매중으로 변경
    transaction.state = "shipping";
    await transaction.save();

    // 결과 response
    res.json({
      success: true,
      message: "운송장이 입력되었습니다."
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: "에러발생: " + e
    });
  }
});

/**
 * 구매자 구매 확정
 */
router.post("/purchase_confirm", async function(req, res, next) {
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
    product = await Product.findOne({ _id: body.productId });
    seller = await User.findOne({ _id: product.user });
    buyer = await User.findOne({ email: req.session.email });
    transaction = await Transaction.findOne({ product: body.productId });

    // 계정잠금해제
    await web3.eth.personal.unlockAccount(buyer.account.address, buyer.account.privateKey, 600);
    // 물품의 스마트 컨트랙트
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, product.contractAddress);

    // 구매 확정 함수 호출
    result = await escrowContract.methods.buyer_receive(transaction.inputNumber).send({
      from: buyer.account.address
    });

    console.log(result);

    // 구매자, 판매자 페이백 기록
    // let transaction = await web3.eth.getTransaction(txId);
    let blockTransaction = new BlockTransaction();
    // blockTransaction.hash = transaction.hash
    blockTransaction.from = product.contractAddress;
    blockTransaction.to = buyer.account.address;
    blockTransaction.value = String(web3.utils.toWei(String(product.price), "ether"));
    await blockTransaction.save();

    //판매자 입금기록
    // let transaction = await web3.eth.getTransaction(txId);
    blockTransaction = new BlockTransaction();
    // blockTransaction.hash = transaction.hash
    blockTransaction.from = product.contractAddress;
    blockTransaction.to = seller.account.address;
    blockTransaction.value = String(web3.utils.toWei(String(product.price), "ether"));
    await blockTransaction.save();

    // 여기서부터 구매 확정 성공
    // 물품 거래내역 db 업데이트
    // 물품 상태 구매확정으로 변경
    transaction.state = "success";
    await transaction.save();

    // 결과 response
    res.json({
      success: true,
      message: "구매확정이 완료되었습니다."
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: "에러발생: " + e
    });
  }
});

/**
 * 구매자 구매 취소
 */
router.post("/purchase_cancel", async function(req, res, next) {
  // 변수들 미리 세팅
  let result, user, escrowContract, transaction, body, product, address, balance;
  body = req.body;

  // 로그인 되었는지 체크
  if (!req.session.email) {
    res.json({ success: false, message: "로그인 해주세요." });
    return;
  }

  try {
    // DB에서 정보 미리 읽어옴
    product = await Product.findOne({ _id: body.productId });
    user = await User.findOne({ email: req.session.email });
    transaction = await Transaction.findOne({ product: body.productId });

    // 계정잠금해제
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);
    // 물품의 스마트 컨트랙트
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, product.contractAddress);

    // 구매 취소 함수 호출
    result = await escrowContract.methods.transact_cancel().send({
      from: user.account.address
    });

    let blockTransaction = new BlockTransaction();
    // blockTransaction.hash = transaction.hash;
    blockTransaction.from = product.contractAddress;
    blockTransaction.to = user.account.address;
    blockTransaction.value = String(web3.utils.toWei(String(product.price * 2), "ether"));
    await blockTransaction.save();

    console.log(result);

    // 여기서부터 구매 취소 성공
    // 물품 거래내역 db 업데이트
    // 물품 상태 구매취소로 변경
    transaction.state = "cancel";
    await transaction.save();

    // 결과 response
    res.json({
      success: true,
      message: "구매취소가 완료되었습니다."
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: "에러발생: " + e
    });
  }
});


/**
 * 구매자 구매 사기
 */
router.post("/purchase_scam", async function(req, res, next) {
  // 변수들 미리 세팅
  let result, user, seller, escrowContract, transaction, body, product, address, balance;
  body = req.body;

  // 로그인 되었는지 체크
  if (!req.session.email) {
    res.json({ success: false, message: "로그인 해주세요." });
    return;
  }

  try {
    // DB에서 정보 미리 읽어옴
    product = await Product.findOne({ _id: body.productId });
    user = await User.findOne({ email: req.session.email });
    seller = await User.findOne({ _id: product.user });
    transaction = await Transaction.findOne({ product: body.productId });

    // 계정잠금해제
    await web3.eth.personal.unlockAccount(user.account.address, user.account.privateKey, 600);
    // 물품의 스마트 컨트랙트
    escrowContract = new web3.eth.Contract(config.contracts.escrow.ABI, product.contractAddress);

    // 구매 사기 함수 호출
    result = await escrowContract.methods.transact_scam().send({
      from: user.account.address
    });

    console.log(result);

    // 여기서부터 구매 취소 성공
    // 물품 거래내역 db 업데이트
    // 물품 상태 구매취소로 변경
    transaction.state = "cancel";
    await transaction.save();

    let blockTransaction = new BlockTransaction();
    // blockTransaction.hash = transaction.hash;
    blockTransaction.from = product.contractAddress;
    blockTransaction.to = seller.account.address;
    blockTransaction.value = String(web3.utils.toWei(String(product.price * 2), "ether"));
    await blockTransaction.save();

    // 결과 response
    res.json({
      success: true,
      message: "구매취소가 완료되었습니다."
    });
  } catch (e) {
    console.log(e);

    res.json({
      success: false,
      message: "에러발생: " + e
    });
  }
});

module.exports = router;
