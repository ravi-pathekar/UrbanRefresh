const mongoose = require("mongoose");

const ServiceSubCategorySchema = new mongoose.Schema(
  {
    serviceSubCategoryName: {
      type: String,
      lowercase: true,
      required: true,
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "serviceCategory",
    },
    completionTime: String,
    image: { type: String, default: "www.image.com" },
    description: String,
    isPriceVariants: {
      type: Boolean,
      required: true,
    },
    priceVariants: [
      {
        priceType: { type: String, required: true },
        price: { type: Number, required: true },
        isDefault: {
          type: Boolean,
          required: true,
        },
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
