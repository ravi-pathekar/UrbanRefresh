const FaqModel = require("./faq.model");

class Faq {
  static async getAllFaq(req, res) {
    try {
      const faq = await new FaqModel().faq.find({}).lean();
      res.status(200).send(faq);
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
  static async addMainFaq(req, res) {
    try {
      const addfaq = await new FaqModel().faq(req.body).save();
      if (addfaq) {
        res.status(201).send("Data Has addded Succesfully");
      }
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
  static async updateMainFaq(req, res) {
    res.send("updateMainFaq");
  }
  static async deleteMainFaq(req, res) {
    try {
      const deleteFaq = await new FaqModel().faq
        .deleteOne({ _id: req.params.faqId })
        .lean();

      if (deleteFaq.deletedCount) {
        res.status(200).send("Faq Deleted Succesfully");
      } else {
        res.status(400).send("Something error.....");
      }
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
}

module.exports = Faq;
