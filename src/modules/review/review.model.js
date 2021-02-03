const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    serviceProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceProvider",
      required: true,
    },
    reviews: [
      {
        userName: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          max: 5,
          required: true,
        },
        comment: {
          type: String,
          maxlength: 255,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("review", ReviewSchema);

module.exports = Review;
