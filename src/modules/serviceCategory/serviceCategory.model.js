const mongoose = require("mongoose");

const ServiceCategorySchema = new mongoose.Schema(
  {
    serviceCategoryName: {
      type: String,
      required: true,
    },
    parentServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "service",
    },
    // serviceSubCategories: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "servicesubcategories",
    //   },
    // ],
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
