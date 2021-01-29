const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceCategory",
      required: true,
    },
    cartItems: [
      {
        serviceSubCategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceSubCategory",
          required: true,
        },
        image: String,
        description: {
          type: String,
          lowercase: true,
        },
        quantity: {
          type: Number,
          max: 99,
          min: 1,
          required: true,
        },
        note: {
          type: String,
          lowercase: true,
        },
        pricePerItem: {
          type: Number,
          required: true,
        },
      },
    ],
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
