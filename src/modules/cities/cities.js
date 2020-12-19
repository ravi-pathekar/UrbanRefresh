const CityModel = require("./cities.model");

class City {
  static async addCities(req, res, next) {
    const { cityName, countryName, currencyCode } = req.body;

    const savedCity = await CityModel.insertMany({
      cityName: cityName,
      countryName: countryName,
      currencyCode: currencyCode,
    });

    res.sendResponse(savedCity);
  }

  static async getCities(req, res, next) {
    const cities = await CityModel.find().lean();

    res.sendResponse(cities);
  }
}

module.exports = City;
