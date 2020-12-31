const express = require("express");
const router = express.Router();
const Cart = require("./cart");

router.post("/addToCart", Cart.addToCart);

router.delete("/deleteItemFromCart", Cart.deleteItemFromCart);

router.delete("/deleteCart", Cart.deleteCart);

router.put("/decreaseItemQuantity", Cart.decreaseItemQuantity);

module.exports = router;
