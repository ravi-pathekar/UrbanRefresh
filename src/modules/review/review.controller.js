const express = require("express");
const router = express.Router();
const Review = require("./review");

router.post("/addReview", Review.addReview);
router.get("/getReview", Review.getReview);

module.exports = router;
