const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const authSchema = Joi.object({
  firstName: Joi.string().lowercase().trim().required(),
  lastName: Joi.string().lowercase().trim().required(),
  contactNumber: Joi.string().lowercase().min(10).max(10).required(),
  email: Joi.string().email().lowercase().trim().required(),
  isActive: Joi.boolean().required(),
  password: Joi.string().min(6).trim().required(),
  address: Joi.object({
    addressLine1: Joi.string()
      .lowercase()
      .trim()
      .max(500)
      .truncate()
      .required(),
    addressLine2: Joi.string().lowercase().trim().max(500).truncate(),
    city: Joi.string().lowercase().trim().max(100).required(),
    state: Joi.string().lowercase().trim().max(100).required(),
    pinCode: Joi.string().lowercase().trim().max(10).required(),
  }).required(),
  membershipType: Joi.object({
    membershipId: Joi.objectId(),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
});

module.exports = {
  authSchema,
};
