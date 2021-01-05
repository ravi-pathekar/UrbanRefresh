const createError = require("http-errors");
const crypto = require("crypto");
const mongoose = require("mongoose");
const UserModel = require("./user.model");
const { authSchema } = require("../../shared/validationSchema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../shared/Tokens");
const nodeMailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

class User {
  static async register(req, res, next) {
    try {
      const result = await authSchema.validateAsync(req.body);

      const doesExist = await UserModel.findOne({ email: req.body.email });

      if (doesExist) {
        throw createError.Conflict(
          `${req.body.email} already been registered!!!`
        );
      }

      if (req.body.membershipId) {
        req.body.membershipStartDate = Date.now();
        req.body.membershipEndDate =
          req.body.membershipStartDate +
          1000 * 60 * 60 * 24 * req.body.membershipDays;
      }

      const user = new UserModel(req.body);
      const savedUser = await user.save();
      const accessToken = await signAccessToken(savedUser.id);
      const refreshToken = await signRefreshToken(savedUser.id);

      // Send mail to the user on registration
      transporter
        .sendMail({
          to: req.body.email,
          from: "ravipathekar99@gmail.com",
          subject: "registration success",
          html: "<p>Welcome to Urban Refresh.</p>",
        })
        .then(() => console.log("email sent!!!"));

      res.sendResponse({ savedUser, accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findOne({ email: email });

      if (!user) throw createError.NotFound("User not registered!!!");

      const isMatch = await user.isValidPassword(password);
      if (!isMatch)
        throw createError.Unauthorized("Username/Password not valid!!!");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);

      res.send({ accessToken, refreshToken });
    } catch (error) {
      next(createError.BadRequest("Invalid Username or Password!!!"));
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();

      const userId = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(userId);
      const refToken = await signRefreshToken(userId);
      res.send({ accessToken, refToken });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      // const userId = await verifyRefreshToken(refreshToken);
      const message = "User Successfully Logged Out!!!";
      res.sendResponse(message, 204, true);
    } catch (error) {
      next(error);
    }
  }
  static async resetPassword(req, res, next) {
    try {
      const { email, refreshToken } = req.body;

      if (!refreshToken) throw createError.BadRequest();

      crypto.randomBytes(32, (err, bufffer) => {
        if (err) {
          console.log(err);
        }
        const cryptToken = bufffer.toString("hex");
        UserModel.findOne({ email: email }).then((user) => {
          if (!user) {
            // throw createError.BadRequest();
            return res.status(422);
          }
          user.passwordResetCode = cryptToken;
          user.resetExpiryDate = Date.now() + 360000;
          user.save().then((result) => {
            transporter.sendMail({
              to: result.email,
              from: "ravipathekar99@gmail.com",
              subject: "Password Reset",
              html: `
              <p>You requested for password request</p>
              <h5>Click on this <a href='http://localhost:5050/user/updatePassword/${cryptToken}'>link</a> to reset password</h5>`,
            });
          });
        });
      });

      // const userId = await verifyRefreshToken(refreshToken);
      let message = "Password link has been sent to your email.";
      res.sendResponse(message, 200, true);
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req, res, next) {
    try {
      const { password, cryptToken } = req.body;
      if (password.length < 6)
        throw createError.NotAcceptable(
          "Password length should be greater than 6 characters"
        );
      UserModel.findOne({
        passwordResetCode: cryptToken,
        resetExpiryDate: { $gt: Date.now() },
      })
        .then((user) => {
          if (!user) {
            return res.status(422);
          }
          user.password = password;
          user.passwordResetCode = "";
          user.resetExpiryDate = null;
          user.save().then((savedUser) => {
            res.sendResponse("Password Changed!!!");
          });
        })
        .catch((err) => next(err));
    } catch (error) {
      next(error);
    }
  }

  // static async endDate(req, res, next) {
  //   let startDate = Date.now();
  //   const endDate = startDate + 1000 * 60 * 60 * 24 * 28;

  //   res.sendResponse({});
  // }

  static async updateProfile(req, res, next) {
    try {
      const userId = req.payload.aud;
      const { firstName, lastName, address, email, contactNumber } = req.body;
      let data = {};

      if (firstName && firstName !== "") {
        data.firstName = firstName;
      }

      if (lastName && lastName !== "") {
        data.lastName = lastName;
      }

      if (email && email !== "") {
        data.email = email;
      }

      if (address && address !== "") {
        data.address = address;
      }

      if (contactNumber && contactNumber !== "") {
        data.contactNumber = contactNumber;
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: userId },
        data,
        {
          new: true,
        }
      ).select("-__v -createdAt -updatedAt -password");

      res.sendResponse(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = User;
