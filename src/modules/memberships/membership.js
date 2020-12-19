const MembershipModel = require("./membership.model");

class Membership {
  static async addMembership(req, res, next) {
    const savedMembership = await MembershipModel.insertMany(req.body);

    res.sendResponse(savedMembership);
  }

  static async getMembership(req, res, next) {
    const allMembership = await MembershipModel.find().lean();

    res.sendResponse(allMembership);
  }
}

module.exports = Membership;
