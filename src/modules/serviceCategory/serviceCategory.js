const ServiceCategoryModel = require("./serviceCategory.model");

class ServiceCategory {
  static async addServiceCategory(req, res, next) {
    const addedServiceCategory = await ServiceCategoryModel.create(
      req.body
    );

    res.sendResponse(addedServiceCategory);
  }

  static async getServiceCategory(req, res, next) {
    const allServiceCategory = await ServiceCategoryModel.find().lean();

    res.sendResponse(allServiceCategory);
  }
}

module.exports = ServiceCategory;
