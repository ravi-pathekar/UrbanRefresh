const express = require("express");
const router = express.Router();
const ServiceProvider = require("./serviceProvider");

router.post("/addServiceProvider", ServiceProvider.addServiceProvider);

router.get("/getServiceProvider", ServiceProvider.getServiceProvider);

module.exports = router;
