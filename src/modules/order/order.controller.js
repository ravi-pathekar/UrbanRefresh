const express = require("express");
const router = express.Router();
const Order = require("./order");

router.post("/v1/addOrder", Order.addOrder);

module.exports = router;
