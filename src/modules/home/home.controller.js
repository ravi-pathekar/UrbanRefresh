const router = require("express").Router();
const Home = require("./home");

router.get("/", Home.home);

router.get("/:city", Home.getServices);

router.get("/:city/service/:service", Home.getServiceCategory);

// router.get('/:city/service/:serviceID/serviceCategory/:serviceCategoryId', Home.getServiceSubCategory)

module.exports = router;
