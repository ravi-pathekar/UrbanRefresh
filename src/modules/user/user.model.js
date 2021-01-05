const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, lowercase: true, trim: true },
    lastName: { type: String, required: true, lowercase: true, trim: true },
    contactNumber: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 10,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    isActive: { type: Boolean, default: false, required: true },
    password: {
      type: String,
      required: true,
      minlength: [6, "Minimum password length must be 6 character"],
    },
    address: {
      addressLine1: { type: String, required: true, lowercase: true },
      addressLine2: { type: String, lowercase: true },
      city: { type: String, required: true, lowercase: true },
      state: { type: String, required: true, lowercase: true },
      pinCode: { type: String, required: true },
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "membership",
    },
    membershipStartDate: {
      type: Date,
      required: function () {
        if (this.membershipId) return true;
      },
    },
    membershipEndDate: {
      type: Date,
      required: function () {
        if (this.membershipId) return true;
      },
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
