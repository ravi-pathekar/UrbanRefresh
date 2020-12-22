const express = require("express");
const router = express.Router();
const Cart = require('./cart')

router.post("/addToCart", Cart.addToCart);

module.exports = router;
