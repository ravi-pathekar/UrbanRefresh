const ServiceModel = require("./../service/service.model");
const ServiceCategory = require("./../serviceCategory/serviceCategory.model");

class Dashboard {
  static async findByCityID(req, res) {
    try {
      const service = await new ServiceModel().service.find({}).lean();
      const data = [];
      service.map(services => {
        services.city.map(cities => {
          if (cities == req.params.cityId) {
            data.push(services);
          }
        });
      });
      res.send(data);
    } catch (err) {
      res.send("ERROR::");
    }
  }

  static async getServices(req, res) {
    try {
      const { cityId, serviceId } = req.params;
      //   const serviceCategories = await new ServiceCategory().serviceCategory
      //     .find({})
      //     .lean();
      const serviceCategories = await new ServiceCategory().serviceCategory
        .find({ parentServiceId: serviceId })
        // .populate('serviceSubCategory')
        .lean();
      res.send(serviceCategories);
    } catch (err) {
      res.send(err);
    }
  }
}

module.exports = Dashboard;
