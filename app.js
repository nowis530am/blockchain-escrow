import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
const MongoStore = require('connect-mongo')(session);
import expressLayouts from "express-ejs-layouts";
import mongoose from "./config/database";

var indexRouter = require("./routes/index");
var accountRouter = require("./routes/account");
var web3Router = require("./routes/web3");
var apiRouter = require("./routes/api");

var app = express();

// view engine setup, ejs 사용
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "blockchain-web secret key",
  store: new MongoStore({ mongooseConnection: mongoose.conn }),
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// session 사용
// app.use(
//   session({
//     secret: "blockchain-web secret key",
//     resave: true,
//     saveUninitialized: true,
//     cookie: { secure: false }
//   })
// );

// layout 사용
app.use(expressLayouts);
// <script> 태그를 body 끝에 추가
app.set("layout extractScripts", true);

app.use("/account", accountRouter);
app.use("/web3", web3Router);
app.use("/api", apiRouter);
app.use("/", indexRouter);

// 404에러를 eror handler로 
app.use(function(req, res, next) {
  next(createError(404));
});

// error 핸들러
app.use(function(err, req, res, next) {
  // error page 렌더링
  res.status(err.status || 500);

  if(req.path.includes("/web3")) {
    res.json({
      type: "error",
      status: err.status || 500,
      message: err.message
    });
  } else {
    // development 환경에서만 error 출력
    res.locals = {
      title: "Error - " + err.status || 500,
      req: req,
      error: req.app.get("env") === "development" ? err : {},
      message: err.message
    };
    res.status(500).render("error");
  }
});

module.exports = app;
