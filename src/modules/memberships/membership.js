const MembershipModel = require("./membership.model");
const UserModel = require("./../user/user.model");
class Membership {
  static async addMembership(req, res, next) {
    const savedMembership = await MembershipModel.insertMany(req.body);

    res.sendResponse(savedMembership);
  }

  static async getMembership(req, res, next) {
    const allMembership = await MembershipModel.find().lean();

    res.sendResponse(allMembership);
  }

  static async renewMembership(req, res) {
    try {
      const { membershipId,membershipDays } = req.body;
      
      const checkMembership = await MembershipModel.findOne({
        _id: membershipId
      });
      if (!checkMembership) {
        throw new Exception("ObjectNotFound");
      }
      const customerId = "5ff6d0e2d202e54baa3fe0a2"; 

      const isValid = await Membership.checkAuthorisedCustomer(customerId);

      if (isValid) {
        if (Date.parse(isValid.membershipType.endDate) > Date.now()) {
          // expire k phle renew
          if (membershipId == isValid.membershipType.membershipId) {
            const expireDate =
              Date.parse(isValid.membershipType.endDate) +
              1000 * 60 * 60 * 24 * parseInt(membershipDays);
            const query = {
              "membershipType.endDate": expireDate
            };
            const membership = await Membership.updateMembership(
              customerId,
              query
            );
          } else {
            throw new Exception(
              "ValidationError",
              "Only Same Service As Renew...."
            );
          }
          res.sendResponse("Membership has Activated on you Accoount");
        } else {
          // expire k badd renew
          const startDate = Date.now();
          const expireDate =
            Date.now() + 1000 * 60 * 60 * 24 * parseInt(membershipDays);
          const query = {
            "membershipType.membershipId": membershipId,
            "membershipType.startDate": startDate,
            "membershipType.endDate": expireDate
          };
          const membership = await Membership.updateMembership(
            customerId,
            query
          );
          res.sendResponse("Membership has Activated on you Accoount");
        }
      }
    } catch (err) {
      res.status(400).send(err);
    }
  }

  static async updateMembership(customerId, query) {
    const membership = await UserModel.findOneAndUpdate(
      {
        _id: customerId
      },
      query
    );
    if (!membership) {
      throw new Exception("GeneralError");
    }
    return membership;
  }

  static async checkAuthorisedCustomer(customerId) {
    const authorised = await UserModel.findOne({ _id: customerId });
    if (!authorised) {
      throw new Exception("UnAuthorizedUser");
    }
    return authorised;
  }
}

module.exports = Membership;
