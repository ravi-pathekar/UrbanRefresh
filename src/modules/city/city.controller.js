const express = require("express");
const router = express.Router();
const City = require("./city");

router.post("/addCity", City.addCities);

router.get("/getCity", City.getCities);

module.exports = router;
