const createError = require("http-errors");
const CityModel = require("../city/city.model");
const ServiceModel = require("../service/service.model");
const ServiceCategoryModel = require("../serviceCategory/serviceCategory.model");
const ServiceProviderModel = require("../serviceProvider/serviceProvider.model");
const FaqModel = require("../faq/faq.model");
const ServiceSubCategoryModel = require("../serviceSubCategory/serviceSubCategory.model");

class Home {
  static async home(req, res, next) {
    try {
      let cityDetails = await CityModel.aggregate([
        {
          $group: { _id: "$countryName", cities: { $push: "$$ROOT" } },
        },
        {
          $project: {
            _id: 0,
            countryName: "$_id",
            "cities._id": 1,
            "cities.cityName": 1,
            "cities.currencyCode": 1,
          },
        },
      ]);
      res.sendResponse(cityDetails);
    } catch (error) {
      next(error);
    }
  }

  static async getServices(req, res, next) {
    try {
      const { city } = req.params;
      const services = await ServiceModel.find({
        cities: { $in: [city] },
      }).select("-__v -createdAt -updatedAt -cities");
      res.sendResponse(services);
    } catch (error) {
      next(error);
    }
  }

  static async getServiceCategory(req, res, next) {
    try {
      let { city, service } = req.params;

      const cityDetails = await CityModel.findOne({
        _id: city,
      })
        .select("cityName")
        .lean();
      if (!cityDetails) {
        throw createError.BadRequest();
      }

      const serviceDetails = await ServiceModel.findOne({
        $and: [{ _id: service }, { cities: { $in: [city] } }],
      });
      if (!serviceDetails) {
        throw createError.BadRequest();
      }

      const serviceCategory = await ServiceCategoryModel.find({
        parentServiceId: service,
      })
        .select("serviceCategoryName")
        .lean();

      const serviceProvider = await ServiceProviderModel.aggregate([
        {
          $match: {
            $and: [
              { services: { $in: [service] } },
              { servingCity: cityDetails["cityName"] },
            ],
          },
        },
        {
          $lookup: {
            from: "reviews",
            let: { providerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$serviceProviderId", "$$providerId"],
                  },
                },
              },
              {
                $group: {
                  _id: "$serviceProviderId",
                  reviews: { $push: "$reviews" },
                },
              },
              {
                $project: {
                  _id: 0,
                  reviews: {
                    $map: {
                      input: "$reviews",
                      as: "review",
                      in: { $mergeObjects: "$$review" },
                    },
                  },
                },
              },
            ],
            as: "Reviews",
          },
        },
        {
          $project: {
            servingCity: 1,
            serviceProviderName: 1,
            image: 1,
            Reviews: {
              reviews: {
                userName: 1,
                rating: 1,
                comment: 1,
              },
            },
          },
        },
      ]);

      const faqs = await FaqModel.find({ serviceId: service })
        .select("question answer -_id")
        .lean();
      res.sendResponse({ serviceCategory, serviceProvider, faqs });
    } catch (error) {
      next(error);
    }
  }

  static async getServiceSubCategory(req, res, next) {
    try {
      const { city, serviceId, serviceCategoryId } = req.params;
      const serviceDetails = await ServiceModel.findOne({
        $and: [{ _id: serviceId }, { cities: { $in: [city] } }],
      });
      if (!serviceDetails) {
        throw createError.BadRequest();
      }

      const serviceCategoryDetails = await ServiceSubCategoryModel.find({
        serviceCategoryId: serviceCategoryId,
      })
        .select("-createdAt -updatedAt -__v")
        .lean();
      if (!serviceCategoryDetails) {
        throw createError.BadRequest();
      }
      res.sendResponse(serviceCategoryDetails);
    } catch (error) {
      next(error);
    }
  }

  static async getServiceSubCategoryDetails(req, res, next) {
    try {
      const { serviceSubCategoryId } = req.params;
      const serviceSubCategoryDetails = await ServiceSubCategoryModel.findOne({
        _id: serviceSubCategoryId,
      })
        .select("-createdAt -updatedAt -__v")
        .lean();
      if (!serviceSubCategoryDetails) {
        throw createError.BadRequest();
      }
      res.sendResponse(serviceSubCategoryDetails);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Home;
