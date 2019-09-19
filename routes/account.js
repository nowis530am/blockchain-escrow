var express = require("express");
var router = express.Router();
import { User } from "../models";

// 계정관리 시작
router.get("/login", function(req, res, next) {
  res.locals = {
    title: "로그인",
    req: req
  };
  res.render("login", { req });
});
router.post("/login", async function(req, res, next) {
  let body = req.body;
  res.locals = {
    title: "로그인",
    req: req
  };
  let user;
  req.errorMessage = new Array();
  req.successMessage = new Array();

  try {
    if(!body.email) {
      req.errorMessage.push("이메일 주소를 입력해주세요.")
    }
    if(!body.password) {
      req.errorMessage.push("비밀번호를 입력해주세요.")
    }

    user = await User.findOne({email: body.email, password: body.password});
    if(user) {
      req.session._id = user._id;
      req.session.email = user.email;
      req.session.name = user.name;
      res.redirect("/");
    } else {
      req.errorMessage.push("존재하지 않거나 이메일/비밀번호가 다릅니다.");
      res.render("login", { req });
    }
  } catch (e) {
    let errorMessage;
    if (e instanceof TypeError) {
      errorMessage = "이메일 또는 비밀번호를 입력해주세요";
    } else {
      errorMessage = e;
    }
    res.status(500).render("error", {
      error: {
        message: errorMessage
      }
    });
  }
});
router.get("/logout", (req, res) => {
  res.locals = {
    title: "로그아웃",
    req: req
  };
  req.session.destroy();
  res.redirect("/");
});
router.get("/signup", function(req, res, next) {
  res.locals = {
    title: "회원가입",
    req: req
  };
  res.render("signup", { req });
});
router.post("/signup", async function(req, res, next) {
  let body = req.body;
  res.locals = {
    title: "회원가입",
    req: req
  };
  req.errorMessage = new Array();
  req.successMessage = new Array();


  if(!body.email) {
    req.errorMessage.push("이메일 주소를 입력해주세요.")
  }
  if(!validateEmail(body.email)) {
    req.errorMessage.push("이메일 형식이 올바르지 않습니다.");
  }
  if(!body.password || !body.password_confirm) {
    req.errorMessage.push("비밀번호 또는 비밀번호 확인을 입력해주세요.");
  }
  if(body.password != body.password_confirm) {
    req.errorMessage.push("비밀번호와 비밀번호 확인이 다릅니다.");
  }
  if(req.errorMessage.length > 0) {
    res.render("signup", { req });
    return;
  }


  try {
    let user;
    user = await User.findOne({email: body.email});
    if(user) {
      req.errorMessage.push("이미 존재하는 이메일입니다.");
      res.render("signup", { req });
      return;
    } else {
      user = new User();
    }
    user.email = body.email;
    user.password = body.password;
    await user.save();

    req.successMessage.push("회원가입이 완료되었습니다.");
    res.render("signup", { req });
  } catch (e) {
    res.render("error", {
      error: {
        message: e
      }
    });
  }

  

});
// 계정관리 끝

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports = router;
