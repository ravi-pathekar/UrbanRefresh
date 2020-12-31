const ServiceCategory = require("../serviceCategory/serviceCategory.model");
const ServiceSubCategoryModel = require("./serviceSubCategory.model");

class ServiceSubCategory {
  static async addServiceSubCategory(req, res, next) {
    const savedSubCategory = await ServiceSubCategoryModel.create(req.body);

    res.sendResponse(savedSubCategory);
  }

  static async getServiceSubCategory(req, res, next) {
    const allSubCategories = await ServiceSubCategoryModel.find().lean();

    res.sendResponse(allSubCategories);
  }
}

module.exports = ServiceSubCategory;
