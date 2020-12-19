const mongoose = require("mongoose");

const ServiceProviderSchema = new mongoose.Schema(
  {
    serviceProviderName: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    image: String,
    address: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
    },
    services: [
      {
        type: String,
        required: true,
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

ServiceProviderSchema.pre("save", async function (next) {
  try {
    // logic for matching cities and services
    console.log("Service provider pre save---------------->");
  } catch (error) {}
});

module.exports = ServiceProvider;
