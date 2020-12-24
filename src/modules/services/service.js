const ServiceModel = require("./service.model");
const CityModel = require("../cities/cities.model");

class Service {
  static async addServices(req, res, next) {
    const { serviceName, cities } = req.body;

    console.log("cities-----------------8------>", cities);

    const savedservice = await ServiceModel.create({
      serviceName,
      cities,
    });

    res.sendResponse(savedservice);
  }

  static async getServices(req, res, next) {
    const services = await ServiceModel.find().lean();

    res.sendResponse(services);
  }
}

module.exports = Service;
