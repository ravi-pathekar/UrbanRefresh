const mongoose = require("mongoose");

const MembershipSchema = new mongoose.Schema(
  {
    membershipType: {
      type: String,
      required: true,
    },
    price: [
      {
        expiresIn: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    MembershipDiscount: Number,
  },
  {
    timestamps: true,
  }
);

const Membership = mongoose.model("membership", MembershipSchema);

module.exports = Membership;
