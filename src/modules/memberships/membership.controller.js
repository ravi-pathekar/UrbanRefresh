const express = require("express");
const router = express.Router();
const Membership = require("./membership");

router.post("/addMembership", Membership.addMembership);

router.get("/getMembership", Membership.getMembership);

module.exports = router;
