const express = require("express");
const router = express.Router();
const ServiceCategory = require("./serviceCategory");

router.post("/addServiceCategory", ServiceCategory.addServiceCategory);

router.get("/getServiceCategory", ServiceCategory.getServiceCategory);

module.exports = router;
