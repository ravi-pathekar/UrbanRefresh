const express = require("express");
const router = express.Router();
const Service = require("./service");

router.post("/addServices", Service.addServices);

router.get("/getServices", Service.getServices);

router.get("/v1/:cityId/search/service", Service.searchServices);

module.exports = router;
