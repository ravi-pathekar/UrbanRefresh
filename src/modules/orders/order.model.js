const { string } = require("joi");
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    servicesOrdered: [
      {
        serviceSubCategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceSubCategory",
          required: true,
        },
        quantity: { type: Number, default: 1 },
        note: String,
        serviceDetails: {
          serviceSubCategoryName: String,
          serviceCategoryId: String,
          serviceId: String,
          serviceProviderName: String,
          price: Number,
        },
        serviceProviderDetails: {
          providerName: {
            type: String,
            required: true,
          },
          contactNumber: {
            type: String,
            required: true,
          },
        },
        deliveryDate: {
          type: Date,
          required: true,
        },
        deliveryTime: {
          type: String,
          required: true,
        },
      },
    ],
    orderNo: {
      type: Number,
      required: true,
    },
    note: String,
    membershipDiscount: Number,
    // couponsApplied: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "coupon",
    // },
    couponValue: Number,
    orderStatus: String,
    totalPrice: Number,
    userName: String,
    userEmail: String,
    userContactNo: String,
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
