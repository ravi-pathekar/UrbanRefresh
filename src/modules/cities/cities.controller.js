const express = require("express");
const router = express.Router();
const City = require("./cities");

router.post("/addCity", City.addCities);

router.get("/getCity", City.getCities);

module.exports = router;
