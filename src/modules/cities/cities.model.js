const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      lowercase: true,
      required: true,
    },
    countryName: {
      type: String,
      required: true,
    },
    currencyCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const City = mongoose.model("cities", CitySchema);

module.exports = City;
