const router = require("express").Router();
const Home = require("./home");

router.get("/v1/", Home.home);

router.get("/v1/:city", Home.getServices);

router.get("/v1/:city/service/:service", Home.getServiceCategory);

router.get(
  "/v1/:city/service/:serviceId/serviceCategory/:serviceCategoryId",
  Home.getServiceSubCategory
);

router.get(
  "/v1/serviceSubCategory/:serviceSubCategoryId/details",
  Home.getServiceSubCategoryDetails
);

module.exports = router;
