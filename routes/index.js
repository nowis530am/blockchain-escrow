var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.locals = {
    title: '[Project]NOW IS 05:30 AM - 중고거래 메인',
    req: req
  };
  res.render("index", { req });
});
router.get("/product_details", function(req, res, next) {
  res.locals = {
    title: '물품 상세',
    req: req
  };
  res.render("product_details", { req });
});
router.get("/login", function(req, res, next) {
  res.locals = {
    title: '로그인',
    req: req
  };
  res.render("login", { req });
});
router.post("/login", function(req, res, next) {
  let body = req.body;

  try {
    res.cookie("user", body.email, {
      expires: new Date(Date.now() + 900000),
      httpOnly: true
    });
    req.session.email = body.email;
    res.redirect("/");
  } catch (e) {
    let errorMessage;
    if (e instanceof TypeError) {
      errorMessage = "이메일 또는 비밀번호를 입력해주세요";
    } else {
      errorMessage = e;
    }
    res.status(500).render("error", {
      error: {
        message: "이메일 또는 비밀번호를 입력해주세요"
      }
    });
  }
});
router.get("/logout", (req, res) => {
  res.locals = {
    title: '로그아웃',
    req: req
  };
  req.session.destroy();
  res.redirect("/");
});
router.get("/signup", function(req, res, next) {
  res.locals = {
    title: '회원가입',
    req: req
  };
  res.render("signup", { req });
});
router.get("/contact", function(req, res, next) {
  res.locals = {
    title: '연락',
    req: req
  };
  res.render("contact", { req });
});
router.get("/cart", function(req, res, next) {
  res.locals = {
    title: '장바구니',
    req: req
  };
  res.render("cart", { req });
});
router.get("/product_reg", function(req, res, next) {
  res.locals = {
    title: '물품등록',
    req: req
  };
  res.render("product_reg", { req });
});

module.exports = router;
