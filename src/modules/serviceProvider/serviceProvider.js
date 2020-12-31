const ServiceProviderModel = require("./serviceProvider.model");

class ServiceProvider {
  static async addServiceProvider(req, res, next) {
    const savedProvider = await ServiceProviderModel.create(req.body);

    res.sendResponse(savedProvider);
  }

  static async getServiceProvider(req, res, next) {
    const allProvider = await ServiceProviderModel.find().lean();

    res.sendResponse(allProvider);
  }
}

module.exports = ServiceProvider;
