const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      lowercase: true,
      required: true,
    },
    cities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cities",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model("service", ServiceSchema);

module.exports = Service;
