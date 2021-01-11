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
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "serviceProvider",
          required: true,
        },
        rating: {
          type: Number,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 255,
          trim: true,
          required: true,
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
