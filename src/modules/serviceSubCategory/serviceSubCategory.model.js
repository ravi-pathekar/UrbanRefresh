const mongoose = require("mongoose");

const ServiceSubCategorySchema = new mongoose.Schema(
  {
    serviceSubCategoryName: {
      type: String,
      required: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "serviceCategory",
    },
    completionTime: String,
    image: String,
    descriptin: String,
    priceType: String,
    price: [
      {
        priceTypes: String,
        prices: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ServiceSubCategory = mongoose.model(
  "serviceSubCategory",
  ServiceSubCategorySchema
);

module.exports = ServiceSubCategory;
