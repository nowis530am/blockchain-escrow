import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";

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
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// session 사용
app.use(
  session({
    secret: "blockchain-web secret key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

// layout 사용
app.use(expressLayouts);
// <script> 태그를 body 끝에 추가
app.set("layout extractScripts", true);

app.use("/account", accountRouter);
app.use("/web3", web3Router);
app.use("/api", apiRouter);
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);

  if(req.path.includes("/web3")) {
    res.json({
      type: "error",
      status: err.status || 500,
      message: err.message
    });
  } else {
    // set locals, only providing error in development
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
