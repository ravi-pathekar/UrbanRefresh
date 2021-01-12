const mongoose = require("mongoose");

const ServiceProviderSchema = new mongoose.Schema(
  {
    serviceProviderName: {
      type: String,
      lowercase: true,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
    },
    image: String,
    address: {
      addressLine1: { type: String, lowercase: true, required: true },
      addressLine2: { type: String, lowercase: true },
      city: { type: String, lowercase: true, required: true },
      state: { type: String, lowercase: true, required: true },
      pinCode: { type: String, required: true },
    },
    services: [
      {
        type: String,
        required: true,
      },
    ],
    bookedOn: [
      {
        type: String,
        // required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ServiceProvider = mongoose.model(
  "serviceProvider",
  ServiceProviderSchema
);

module.exports = ServiceProvider;
