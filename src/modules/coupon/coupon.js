const CouponModel = require("./coupon.model");

class Coupon {
  static async addCoupon(req, res, next) {
    const savedCoupon = await CouponModel.create(req.body);
    res.sendResponse(savedCoupon);
  }

  static async getCoupon(req, res, next) {
    const allCoupon = await CouponModel.find();
    res.sendResponse(allCoupon);
  }
}

module.exports = Coupon;
