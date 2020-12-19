const express = require("express");
const router = express.Router();
const Coupon = require("./coupon");

router.post("/addCoupon", Coupon.addCoupon);

router.get("/getCoupon", Coupon.getCoupon);

module.exports = router;
