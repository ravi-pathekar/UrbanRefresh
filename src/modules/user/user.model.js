const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    password: {
      type: String,
      required: true,
      minlength: [6, "Minimum password length must be 6 character"],
    },
    address: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
    },
    membershipType: {
      membershipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "membership",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
    },
    passwordResetCode: {
      type: String,
    },
    resetExpiryDate: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  console.log("pre------------------48-------------->");
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("user", UserSchema);

module.exports = User;
