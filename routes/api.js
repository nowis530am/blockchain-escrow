var express = require("express");
var router = express.Router();
import { Product } from "../models";

// index page
router.get("/", function(req, res, next) {
  res.locals = {
    title: "[Project]NOW IS 05:30 AM - 중고거래 메인",
    req: req
  };

  res.render("index", { req });
});

// 물품관련 시작
router.get("/product_details", function(req, res, next) {
  res.locals = {
    title: "물품 상세",
    req: req
  };
  res.render("product_details", { req });
});
router.post("/product_reg", async function(req, res, next) {
  let body = req.body;
  if (!req.session.email) {
    res.json({ message: "로그인 해주세요." });
    return;
  }

  let product = new Product();
  product.user = req.session._id;
  product.title = body.title;
  product.content = body.content;
  product.price = body.price;
  await product.save();

  res.json({ message: "등록 완료" });
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

module.exports = router;
