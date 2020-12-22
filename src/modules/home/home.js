const { response } = require("express");
const CityModel = require("../cities/cities.model");
const ServiceModel = require("../services/service.model");
const ServiceCategoryModel = require("../serviceCategory/serviceCategory.model");
const ServiceProviderModel = require("../serviceProvider/serviceProvider.model");
// const ServiceSubCategoryModel = require("../serviceSubCategory/serviceSubCategory.model");

class Home {
  static async home(req, res, next) {
    const cities = await CityModel.find()
      .lean()
      .select("-createdAt -updatedAt -__v");
    res.sendResponse(cities);
  }

  static async getServices(req, res, next) {
    const { cityId } = req.body;
    const services = await ServiceModel.find({ cities: cityId }).select(
      "-__v -createdAt -updatedAt"
    );
    res.sendResponse(services);
  }

  static async getServiceCategory(req, res, next) {
    const { serviceId } = req.body;

    const serviceCategories = await ServiceCategoryModel.find({
      parentServiceId: serviceId,
    }).select("-__v -createdAt -updatedAt");

    const reviews = {
      serviceId: 1,
      comment: "Isko lga dala to life Jhinga La La...",
    };

    const serviceProviders = await ServiceProviderModel.find({
      services: serviceId,
    }).select("-__v -createdAt -updatedAt");

    res.sendResponse({ serviceCategories, reviews, serviceProviders });
  }

  // static async getServiceSubCategory (req, res, next) {
  //     const { serviceCategoryId } = req.body

  //     const serviceSubCategories = await ServiceSubCategoryModel.find({serviceCategoryId: serviceCategoryId }).select('-__v -createdAt -updatedAt -priceType')

  //     res.sendResponse(serviceSubCategories)
  // }
}

module.exports = Home;
