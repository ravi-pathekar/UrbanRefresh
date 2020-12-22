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

const cartCheck = Joi.object({
  userId: Joi.objectId().required(),
  cartItems: Joi.array()
    .items(
      Joi.object({
        serviceSubCategoryId: Joi.objectId().required(),
        quantity: Joi.number().min(1).max(99).required(),
        note: Joi.string().max(255).trim().truncate(),
        pricePerItem: Joi.number().required(),
      })
    )
    .required(),
  couponApplied: Joi.objectId(),
});

module.exports = {
  authSchema,
  cartCheck,
};
