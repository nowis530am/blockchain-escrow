var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/product_details', function(req, res, next) {
  res.render('product_details', { title: 'Express' });
});
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});
router.post('/login', function(req, res, next) {
  let body = req.body;
  

  res.cookie("user", body.email , {
    expires: new Date(Date.now() + 900000),
    httpOnly: true
  });
  req.session.email = body.email;
  res.redirect("/");


  res.render('login', { title: 'Express' });
});
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});
router.get('/contact', function(req, res, next) {
  res.render('contact', { title: 'Express' });
});
router.get('/cart', function(req, res, next) {
  res.render('cart', { title: 'Express' });
});
router.get('/product_reg', function(req, res, next) {
  res.render('product_reg', { title: 'Express' });
});

module.exports = router;
