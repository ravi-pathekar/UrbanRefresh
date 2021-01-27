const express = require("express");
const router = express.Router();
const Order = require("./order");

router.post("/v1/addOrder", Order.addOrder);

router.get("/v1/getOrder", Order.getOrder);

router.put("/v1/updateOrderStatus/:orderId", Order.updateOrderStatus);

module.exports = router;
