const createError = require("http-errors");
const crypto = require("crypto");
const mongoose = require("mongoose");
// const client = require("../helpers/init_mongodb")
const User = require("./user.model");
// const { authSchema } = require("../../shared/validationSchema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../shared/generateToken");
const nodeMailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

// const client = require("../helpers/init_redis");

const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

module.exports = {
  register: async (req, res, next) => {
    console.log("register----------------28------------>", req.body);

    try {
      // const { email, password } = req.body;
      // if (!email || !password) throw createError.BadRequest();
      // const result = await authSchema.validateAsync(req.body);
      // console.log("Output-------------------------------------------> ~ file: Auth.Controller.js ~ line 32 ~ register: ~ result", result)

      const doesExist = await User.findOne({ email: req.body.email });
      console.log(
        "Output-------------------------------------------> ~ file: Auth.Controller.js ~ line 35 ~ register: ~ doesExist",
        doesExist
      );

      if (doesExist) {
        throw createError.Conflict(
          `${req.body.email} already been registered!!!`
        );
      }

      console.log("register----------------45------------>");

      const user = new User(req.body);
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
        .then(() => console.log("email sent"));

      res.sendResponse({ savedUser, accessToken, refreshToken });
    } catch (error) {
      // if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      // const result = await authSchema.validateAsync(req.body);
      const { email, password } = req.body;

      const user = await User.findOne({ email: email });

      if (!user) throw createError.NotFound("User not registered!!!");

      const isMatch = await user.isValidPassword(password);
      if (!isMatch)
        throw createError.Unauthorized("Username/Password not valid!!!");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);

      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true)
        return next(createError.BadRequest("Invalid Username or Password!!!"));
      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
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
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);
      // client.DEL(userId, (err, val) => {
      //   if (err) {
      //     console.log(err.msg);
      //     throw createError.InternalServerError();
      //   }
      //   console.log(val);
      //   res.sendStatus(204);
      // });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
  resetPassword: async (req, res, next) => {
    try {
      console.log("Authcont-----------------114-------------->");

      // const { email } = req.body;

      // if (!refreshToken) throw createError.BadRequest();

      crypto.randomBytes(32, (err, bufffer) => {
        if (err) {
          console.log(err);
        }
        const cryptToken = bufffer.toString("hex");
        User.findOne({ email: req.body.email }).then((user) => {
          console.log("Authcont-----------------124-------------->", user);
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
              <h5>Click on this <a href='http://localhost:3000/auth/updatePassword/${cryptToken}'>link</a> to reset password</h5>`,
            });
          });
        });
      });

      // if (!doesExist) throw createError.BadRequest();

      // const userId = await verifyRefreshToken(refreshToken);
    } catch (error) {
      next(error);
    }
  },
  updatePassword: async (req, res, next) => {
    const newPassword = req.body.password;
    const sentToken = req.body.cryptToken;
    User.findOne({
      passwordResetCode: sentToken,
      resetExpiryDate: { $gt: Date.now() },
    })
      .then((user) => {
        if (!user) {
          return res.status(422);
        }
        user.password = newPassword;
        user.passwordResetCode = "";
        user.resetExpiryDate = null;
        user.save().then((savedUser) => {
          console.log("Password Changed...", savedUser.password);
          res.send("Password Changed!!!");
        });
      })
      .catch((err) => console.log(err));
  },
};
