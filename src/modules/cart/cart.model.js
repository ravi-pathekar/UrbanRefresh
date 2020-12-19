const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    cartItems: [
      {
        serviceSubCategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceSubCategory",
          required: true,
        },
        quantity: Number,
        note: String,
      },
    ],
    couponsApplied: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    totalPrice: Number,
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
