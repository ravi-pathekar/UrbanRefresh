const ServiceModel = require("./service.model");
const createError = require("http-errors");

class Service {
  static async addServices(req, res, next) {
    const { serviceName, cities } = req.body;
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

  static async searchServices(req, res, next) {
    try {
      const { search } = req.query;
      const { cityId } = req.params;
      // Exact Match.....
      // const serviceList = await ServiceModel.find({
      //   $text: { $search: searchKeyword}
      // });

      if (search === undefined || search === "") {
        throw createError.BadRequest();
      }
      if (search.length > 2) {
        const serviceList = await ServiceModel.find({
          $and: [
            {
              serviceName: {
                $regex: new RegExp(search),
                $options: "i",
              },
            },
            { cities: { $in: [cityId] } },
          ],
        });

        res.sendResponse({ serviceList });
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = Service;
