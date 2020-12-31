const FaqModel = require("./faq.model");
class Faq {
  static async addFaq(req, res, next) {
    const faq = await FaqModel.create(req.body);
    res.sendResponse(faq);
  }
  static async getFaq(req, res, next) {
    const allFaq = await FaqModel.find().lean();
    res.sendResponse(allFaq);
  }
}
module.exports = Faq;
