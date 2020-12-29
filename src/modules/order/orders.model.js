const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      required: true
    },
    orderStatus: {
      type: Number,
      default: 0,
      required: true
    },
    userDetails: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
      },
      username: {
        type: String,
        required: true
      },
      userEmail: {
        type: String,
        required: true
      },
      deliveryAddress: {
        addressLine1: {
          type: String,
          required: true
        },
        addressLine2: {
          type: String
        },
        city: {
          type: String,
          required: true
        },
        state: {
          type: String,
          required: true
        },
        pinCode: { type: String, required: true }
      },
      contactNumber: { type: Number }
    },
    orderNote: {
      type: String
    },
    couponValue: {
      type: Number
    },

    servicesOrdered: [
      {
        serviceSubCategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceSubCategory",
          required: true
        },
        quantity: { type: Number, default: 1 },
        note: { type: String },
        serviceDetails: {
          serviceSubCategoryName: String,
          serviceCategoryId: String,
          serviceId: String,
          serviceProviderName: String,
          price: Number
        }
      }
    ],
    serviceProviderDetails: {
      providerName: {
        type: String,
        required: true
      },
      contactNumber: {
        type: String,
        required: true
      },
      serviceProviderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "serviceProvider"
        // required: true
      }
    },
    totalPrice: { type: Number },
    couponsApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon"
    },
    deliveryDate: {
      type: Date
      // required: true
    },
    deliveryTime: {
      type: String
      // required: true
    },
    membershipDiscount: { type: Number }
  },
  {
    timestamps: true
  }
);
const Order = mongoose.model("testingOrder", OrderSchema);

module.exports = Order;




