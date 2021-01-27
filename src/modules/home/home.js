const { response } = require("express");
const mongoose = require("mongoose");
const CityModel = require("../city/city.model");
const ServiceModel = require("../service/service.model");
const ServiceCategoryModel = require("../serviceCategory/serviceCategory.model");
const ServiceProviderModel = require("../serviceProvider/serviceProvider.model");
// const ReviewModel = require("../review/review.model");
// const ServiceSubCategoryModel = require("../serviceSubCategory/serviceSubCategory.model");

class Home {
  static async home(req, res, next) {
    let country = {};
    const cityDetails = await CityModel.find()
      .lean()
      .select("-createdAt -updatedAt -__v");

    cityDetails.forEach((obj) => {
      let city = null;
      for (let key in obj) {
        if (key === "countryName") {
          if (country.hasOwnProperty(obj[key])) {
            country[obj[key]].push(city);
          } else {
            country[obj[key]] = [];
            country[obj[key]].push(city);
          }
        }
        if (key === "cityName") {
          city = obj[key];
        }
      }
    });
    res.sendResponse(country);
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
    const objectId = mongoose.Types.ObjectId(serviceId);

    const serviceCategory = await ServiceCategoryModel.aggregate([
      { $match: { parentServiceId: objectId } },
    ]);

    const serviceProvider = await ServiceProviderModel.aggregate([
      {
        $match: {
          $and: [
            { services: { $in: [serviceId] } },
            { servingCity: "bhopal" },
          ],
        },
      },
    ]);

    // const reviews = await ReviewModel.aggregate([
    //   { $match: { serviceProviderId: serviceProvider[0]._id } },
    // ]);

    res.sendResponse({ serviceCategory, serviceProvider });
  }
}

module.exports = Home;
