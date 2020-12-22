const express = require("express");
const router = express.Router();
const Order = require("./order");
const { verifyAccessToken } = require("../../shared/Tokens");

router.post("/addOrder", verifyAccessToken, Order.addOrder);

// router.get("/calculate", Order.calculation);

// router.get("/getOrder", Order.getOrder);

module.exports = router;
