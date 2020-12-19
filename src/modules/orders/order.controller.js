const express = require("express");
const router = express.Router();
const Order = require("./order");

router.post("/addOrder", Order.addOrder);

router.get("/getOrder", Order.getOrder);

module.exports = router;
