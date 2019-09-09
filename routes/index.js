var express = require("express");
var router = express.Router();
import { Product } from "../models";

// index page
router.get("/", async function(req, res, next) {
  let products = await Product.find().sort({ _id: -1 });

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

    res.locals = {
      title: "물품 상세",
      req: req,
      product
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

module.exports = router;
