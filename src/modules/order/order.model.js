const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: Number,
      default: 0,
      required: true,
      enum: [0, 1, 2, 3, 4, 5],
    },
    orderNote: {
      type: String,
    },
    userDetails: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      userEmail: {
        type: String,
        required: true,
      },
      deliveryAddress: {
        addressLine1: {
          type: String,
          required: true,
        },
        addressLine2: {
          type: String,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        pinCode: { type: String, required: true },
      },
      contactNumber: { type: Number },
    },
    serviceCategoryId: { type: String, required: true },
    serviceId: { type: String, required: true },
    servicesOrdered: [
      {
        serviceSubCategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceSubCategory",
          required: true,
        },
        serviceSubCategoryName: { type: String, required: true },
        image: String,
        description: String,
        quantity: { type: Number, default: 1 },
        note: { type: String },
        pricePerItem: Number,
      },
    ],
    serviceProviderDetails: {
      providerName: {
        type: String,
        required: true,
      },
      contactNumber: {
        type: String,
        required: true,
      },
      serviceProviderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "serviceProvider",
        required: true,
      },
    },
    totalPrice: { type: Number },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    deliveryTime: {
      type: String,
      required: true,
    },
    membershipDiscount: { type: Number },
    couponValue: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);
const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
