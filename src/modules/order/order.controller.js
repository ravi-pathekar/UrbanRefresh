const express = require("express");
const router = express.Router();
const Order = require("./order");
// const { verifyAccessToken } = require("../../shared/Tokens");

router.post("/v1/test/orders/addOrder", Order.addOrder);
router.get("/v1/order/customer/allOrders", Order.getCustomerOrder);
router.put("/v1/orders/:orderId/updateOrderStatus", Order.updateOrderStatus);

module.exports = router;
