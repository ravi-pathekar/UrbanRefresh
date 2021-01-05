const express = require("express");
const router = express.Router();
const Cart = require("./cart");

router.post("/v1/addToCart", Cart.addToCart);

router.delete("/v1/deleteItemFromCart", Cart.deleteItemFromCart);

router.delete("/v1/deleteCart", Cart.deleteCart);

router.put("/v1/decreaseItemQuantity", Cart.decreaseItemQuantity);

module.exports = router;
