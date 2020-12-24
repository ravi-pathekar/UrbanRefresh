const { urlencoded } = require("express");
const express = require("express");
const createError = require("http-errors");
require("dotenv").config();
const Mongo = require("./src/shared/mongo");
const HandleRequest = require("./src/shared/handleRequest");

// Import Routes
const UserRoute = require("./src/modules/user/user.controller");
const ServiceRoute = require("./src/modules/services/service.controller");
const ServiceCategoryRoute = require("./src/modules/serviceCategory/serviceCategory.controller");
const ServiceSubCategoryRoute = require("./src/modules/serviceSubCategory/serviceSubCategory.controller");
const ServiceProviderRoute = require("./src/modules/serviceProvider/serviceProvider.controller");
const CityRoute = require("./src/modules/cities/cities.controller");
const CartRoute = require("./src/modules/cart/cart.controller");
const OrderRoute = require("./src/modules/orders/order.controller");
const MembershipRoute = require("./src/modules/memberships/membership.controller");
const CouponRoute = require("./src/modules/coupon/coupon.controller");
const HomeRoute = require("./src/modules/home/home.controller");

// Database Connection
new Mongo();

// Express Middleware
const app = express();
app.use(express.json());
app.use(urlencoded({ extended: true }));

//
app.get("/", (req, res, next) => {
  res.send("Urban-refresh");
});

// HandleRequest
app.use((req, res, next) => {
  new HandleRequest(req, res);
  next();
});

// Routes
app.use("/user", UserRoute);
app.use("/service", ServiceRoute);
app.use("/serviceCategory", ServiceCategoryRoute);
app.use("/serviceSubCategory", ServiceSubCategoryRoute);
app.use("/serviceProvider", ServiceProviderRoute);
app.use("/city", CityRoute);
app.use("/cart", CartRoute);
app.use("/order", OrderRoute);
app.use("/membership", MembershipRoute);
app.use("/coupon", CouponRoute);

app.use("/home", HomeRoute);

// Error Middleware
app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      Status: err.status || 500,
      message: err.message,
    },
  });
});

// Server Connection
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
