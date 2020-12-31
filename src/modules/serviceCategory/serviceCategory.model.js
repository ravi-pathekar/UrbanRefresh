const mongoose = require("mongoose");

const ServiceCategorySchema = new mongoose.Schema(
  {
    serviceCategoryName: {
      type: String,
      lowercase: true,
      required: true,
    },
    parentServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "service",
    },
  },
  {
    timestamps: true,
  }
);

const ServiceCategory = mongoose.model(
  "serviceCategory",
  ServiceCategorySchema
);

module.exports = ServiceCategory;
