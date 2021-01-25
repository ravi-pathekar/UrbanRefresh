const MembershipModel = require("./membership.model");
const UserModel = require("../user/user.model");
const createError = require("http-errors");
const { sendMail } = require("../../shared/mailer");
const templatesDir = `${__dirname}/../../../templates`;
const ejs = require("ejs");

class Membership {
  static async addMembership(req, res, next) {
    const savedMembership = await MembershipModel.create(req.body);
    res.sendResponse(savedMembership);
  }

  static async getMembership(req, res, next) {
    const allMembership = await MembershipModel.find().lean();
    res.sendResponse(allMembership);
  }

  static async updateMembership(req, res, next) {
    try {
      const { membershipId, membershipDays } = req.body;
      const userId = req.payload.aud;

      const membershipDetail = await MembershipModel.findOne({
        _id: membershipId,
      });
      if (!membershipDetail) {
        throw createError.BadRequest();
      }

      const userDetails = await UserModel.findOne({ _id: userId }).populate(
        "membershipId",
        "membershipType"
      );
      const {
        email,
        firstName,
        isActive,
        membershipEndDate,
        membershipId: { membershipType } = { membershipType: null },
      } = userDetails;

      const newMembership = {
        membershipId,
        membershipStartDate: Date.now(),
      };

      let updatedMembership = null;
      if (!isActive) {
        newMembership.membershipEndDate =
          Date.now() + 1000 * 60 * 60 * 24 * membershipDays;
        newMembership.isActive = true;
        updatedMembership = await Membership.__addMembership(
          userId,
          newMembership
        );
      } else {
        if (membershipDetail.membershipType === membershipType) {
          newMembership.membershipEndDate =
            Date.parse(membershipEndDate) +
            1000 * 60 * 60 * 24 * parseInt(membershipDays);
          updatedMembership = await Membership.__addMembership(
            userId,
            newMembership
          );
        } else {
          newMembership.membershipEndDate =
            Date.now() + 1000 * 60 * 60 * 24 * membershipDays;
          updatedMembership = await Membership.__addMembership(
            userId,
            newMembership
          );
        }
      }

      // const html = await ejs.renderFile(
      //   templatesDir + "/registration/registration.ejs",
      //   { user: firstName.toUpperCase() }
      // );

      const html = `<p>Hello ${firstName.toUpperCase()},</p>
      <br>
      <h4>Your membership has been activated</h4>
      <p>Cheers,</p>
      <p>Team Urban Refresh</p>`;
      sendMail(email, "Membership Activated", html);

      const message = "Membership has been activated on your account";
      res.sendResponse(message);
    } catch (err) {
      next(err);
    }
  }

  static async __addMembership(userId, newMembership) {
    const updatedMembership = await UserModel.findOneAndUpdate(
      {
        _id: userId,
      },
      newMembership,
      { new: true }
    );
    if (!updatedMembership) {
      throw createError.InternalServerError();
    }
    return updatedMembership;
  }
}

module.exports = Membership;
