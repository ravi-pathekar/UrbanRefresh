const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    servivceCategoryId: {
      type: String,
      required: true,
    },
    couponValue: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: Boolean,
    isDeleted: Boolean,
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model("coupon", CouponSchema);

module.exports = Coupon;
