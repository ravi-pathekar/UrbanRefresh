const ReviewModel = require("./review.model");
class Review {
  static async addReview(req, res, next) {
    const review = await ReviewModel.create(req.body);
    res.sendResponse(review);
  }
  static async getReview(req, res, next) {
    const allReview = await ReviewModel.find().lean();
    res.sendResponse(allReview);
  }
}
module.exports = Review;
