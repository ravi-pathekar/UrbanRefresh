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
          serviceCategoryName: String,
          serviceName: String,
          serviceProviderName: String,
          price: Number,
        },
        serviceProviderId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "serviceProvider",
        },
        deliveryDate: {
          type: Date,
          required: true,
        },
        deliveryTime: {
          type: Date,
          required: true,
        },
      },
    ],
    note: String,
    membershipDiscount: Number,
    couponsApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
    },
    couponValue: Number,
    orderStatus: String,
    totalPrice: Number,
    userName: String,
    userEmail: String,
    userContactNo: String,
    userMembershipType: String
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
