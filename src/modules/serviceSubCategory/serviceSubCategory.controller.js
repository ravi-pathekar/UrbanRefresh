const express = require("express");
const ServiceCategory = require("../serviceCategory/serviceCategory.model");
const router = express.Router();
const ServiceSubCategory = require("./serviceSubCategory");

router.post("/addServiceSubCategory", ServiceSubCategory.addServiceSubCategory);

router.get("/getServiceSubCategory", ServiceSubCategory.getServiceSubCategory);

module.exports = router;
