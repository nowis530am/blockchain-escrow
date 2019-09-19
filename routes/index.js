var express = require("express");
var router = express.Router();
import moment from "moment";

import { Product, User, Transaction } from "../models";

// index page
router.get("/", async function(req, res, next) {
  let products = await Product.find().sort({ createdAt: -1 });

  res.locals = {
    title: "[Project]NOW IS 05:30 AM - 중고거래 메인",
    req: req,
    products
  };

  res.render("index", { req });
});

// 물품관련 시작
router.get("/product_details/:_id", async function(req, res, next) {
  try {
    let product = await Product.findOne({ _id: req.params._id }).populate("user");
    let transaction = await Transaction.findOne({ product: req.params._id }).populate("buyer").populate("seller");

    res.locals = {
      title: "물품 상세",
      req: req,
      product,
      transaction
    };

    res.render("product_details", { req });
  } catch (e) {
    res.render("product_details", { req });
  }
});
router.get("/product_reg", function(req, res, next) {
  if (!req.session.email) {
    res.redirect("/account/login");
    return;
  }

  res.locals = {
    title: "물품등록",
    req: req
  };
  res.render("product_reg", { req });
});
// 물품관련 끝

router.get("/contact", function(req, res, next) {
  res.locals = {
    title: "연락",
    req: req
  };
  res.render("contact", { req });
});

router.get("/cart", function(req, res, next) {
  res.locals = {
    title: "장바구니",
    req: req
  };
  res.render("cart", { req });
});

/*
 *  /pagetest 엔드포인트 요청(request, req)이 들어오면
 *  view폴더에 있는 pagetest.ejs 파일을 렌더링해서 출력한다.
 */
router.get("/pagetest", function(req, res, next) {
  // URL Endpoint (http://[host]:[port]/endpoint)
  res.locals = {
    title: "페이지테스트", // 페이지 제목
    req: req // http req 변수. 그냥 넘겨주면 됨.
  };

  res.render("pagetest.ejs", { req }); // views폴더에 있는 xxx.ejs 파일을 렌더링. .ejs는 생략가능
});

router.get("/mypage", async function(req, res, next) {
  if (!req.session.email) {
    res.redirect("/account/login");
    return;
  }

  res.locals = {
    title: "마이페이지",
    req: req
  };

  let user = await User.findOne({ email: req.session.email });

  res.render("mypage", { req, user });
});

router.get("/wallet", async function(req, res, next) {
  if (!req.session.email) {
    res.redirect("/account/login");
    return;
  }

  res.locals = {
    title: "지갑",
    req: req
  };

  let user = await User.findOne({ email: req.session.email });

  res.render("wallet", { req, user });
});

router.get("/saleslist", async function(req, res, next) {
  let user, products;

  if (!req.session.email) {
    res.redirect("/account/login");
    return;
  }

  res.locals = {
    title: "판매 목록",
    req: req
  };

  user = await User.findOne({ email: req.session.email });
  products = await Product.find({ user: user._id }).sort({ createdAt: -1 });

  // let newProducts = products.map((item1, key1) => {
  //   products.map((item2, key2) => {

  //   });
  // });
  // console.log(products);
  const groupByCreatedAt = groupBy("createdAt");
  products = groupByCreatedAt(products);

  // console.log(groupByCreatedAt(products));

  // console.log(products);
  res.render("saleslist", { req, products });
});

const groupBy = key => array =>
  array.reduce((objectsByKeyValue, obj) => {
    let value = obj[key];
    value = moment(value).format("YYYY/MM/DD");
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});


router.get("/purchaselist", async function(req, res, next) {
  let user, products, transactions;

  if (!req.session.email) {
    res.redirect("/account/login");
    return;
  }

  res.locals = {
    title: "구매 목록",
    req: req
  };

  user = await User.findOne({ email: req.session.email });

  transactions = await Transaction.find({ buyer: user._id })
    .sort({ createdAt: -1 })
    .populate("buyer")
    .populate("seller")
    .populate("product");

  const groupByCreatedAt = groupBy("createdAt");
  transactions = groupByCreatedAt(transactions);

  res.render("purchaselist", { req, transactions });
});

router.get("/sales_details/:_id", async function(req, res, next) {
  let product, transaction;

  res.locals = {
    title: "판매 상세",
    req: req
  };
  transaction = await Transaction.findOne({ product: req.params._id })
  .populate("buyer")
  .populate("seller")
  .populate("product");

  product = await Product.findOne({ _id: req.params._id })
  .populate("user");

  res.render("sales_details", { req, product, transaction });
});

/**
 * 구매상세
 */
router.get("/purchase_details/:_id", async function(req, res, next) {
  let product, transaction;

  res.locals = {
    title: "주문 상세",
    req: req
  };
  transaction = await Transaction.findOne({ _id: req.params._id })
  .populate("buyer")
  .populate("seller")
  .populate("product");
  product = await Product.findOne({ _id: transaction.product._id })
  .populate("user");

  res.render("purchase_details", { req, product, transaction });
});

// This is Temp!! Delete later
router.get("/product_details_temp", function(req, res, next) {
  res.locals = {
    title: "(임시)상품 상세",
    req: req
  };
  res.render("product_details_temp", { req });
});

// This is Temp!! Delete later
router.get("/modal_link_test", function(req, res, next) {
  res.locals = {
    title: "(임시)모달 링크 테스트",
    req: req
  };
  res.render("modal_link_test", { req });
});

module.exports = router;
