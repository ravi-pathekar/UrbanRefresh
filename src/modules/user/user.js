const createError = require("http-errors");
const crypto = require("crypto");
const UserModel = require("./user.model");
const {
  registerValidate,
  loginValidate,
} = require("../../shared/validationSchema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../shared/tokens");
const { sendMail } = require("../../shared/mailer");
// const { sendMessage } = require("../../shared/textMessage");
const templatesDir = `${__dirname}/../../../templates`;
const ejs = require("ejs");

class User {
  static async register(req, res, next) {
    try {
      const result = await registerValidate.validateAsync(req.body);
      const { email, membershipId } = result;

      const doesExist = await UserModel.findOne({ email: email });

      if (doesExist) {
        throw createError.Conflict(`${email} already been registered!!!`);
      }

      if (membershipId) {
        result.membershipStartDate = Date.now();
        result.membershipEndDate =
          result.membershipStartDate +
          1000 * 60 * 60 * 24 * result.membershipDays;
      }

      const user = new UserModel(result);
      const savedUser = await user.save();

      const html = await ejs.renderFile(
        templatesDir + "/registration/registration.ejs",
        { user: savedUser.firstName.toUpperCase() }
      );

      // Send mail to the user on registration
      sendMail(savedUser.email, "Registration Successful", html);

      // Send text message to the user on registration
      // const body =
      //   "You have successfully registered on UrbanRefresh. Enjoy our services.";
      // const to_msg = savedUser.contactNumber;
      // sendMessage(body, to_msg);

      res.sendResponse(savedUser);
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await loginValidate.validateAsync(req.body);
      const { email, password } = result;

      const user = await UserModel.findOne({ email: email });

      if (!user) throw createError.NotFound("User not registered!!!");

      const isMatch = await user.isValidPassword(password);
      if (!isMatch)
        throw createError.Unauthorized("Username/Password not valid!!!");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);

      res.sendResponse({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(createError.BadRequest("Invalid Username or Password!!!"));
    }
  }

  static async refreshJwtTokens(req, res, next) {
    try {
      let { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();

      const userId = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(userId);
      refreshToken = await signRefreshToken(userId);
      res.sendResponse({ accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { email } = req.body;

      crypto.randomBytes(32, async (err, bufffer) => {
        if (err) {
          next(err);
        }

        const cryptToken = bufffer.toString("hex");
        const user = await UserModel.findOne({ email: email });
        if (!user) {
          throw createError.BadRequest();
        }

        user.passwordResetCode = cryptToken;
        user.resetExpiryDate = Date.now() + 360000;

        let obj = {
          userName: user.firstName.toUpperCase(),
          token: `http://localhost:5050/user/updatePassword/${cryptToken}`,
        };

        const html = await ejs.renderFile(
          templatesDir + "/reset-password/reset-password.ejs",
          { obj: obj }
        );

        user.save().then(async (result) => {
          await sendMail(user.email, "Password Reset", html);
        });
      });

      let message = "Password link has been sent to your email.";
      res.sendResponse(message);
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
      const user = await UserModel.findOne({
        passwordResetCode: cryptToken,
        resetExpiryDate: { $gt: Date.now() },
      });

      if (!user) {
        return createError.BadRequest();
      }
      user.password = password;
      user.passwordResetCode = "";
      user.resetExpiryDate = null;
      user.save().then((savedUser) => {
        const message = "Password Changed!!!";
        res.sendResponse(message);
      });
    } catch (error) {
      next(error);
    }
  }

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
