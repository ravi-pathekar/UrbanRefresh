const express = require("express");
const router = express.Router();
const Service = require("./service");

router.post("/addServices", Service.addServices);

router.get("/getServices", Service.getServices);

module.exports = router;
