const express = require("express");
const router = express.Router();
const Membership = require("./membership");
const { verifyAccessToken } = require("../../shared/tokens");

router.post("/addMembership", Membership.addMembership);

router.get("/getMembership", Membership.getMembership);

router.post(
  "/v1/updateMembership",
  verifyAccessToken,
  Membership.updateMembership
);

module.exports = router;
