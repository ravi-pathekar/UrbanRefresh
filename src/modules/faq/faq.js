const FaqModel = require("./faq.model");

class Faq {
  static async getAllFaq(req, res) {
    try {
      const faq = await new FaqModel().faq.find({}).lean();
      if (!faq) {
        // throw an error
        throw new Exception("ValidationError", "Faqs not found");
      }
      res.sendResponse(faq);
    } catch (err) {
      res.status(400).send(err.message);
    }
  }

  static async addMainFaq(req, res) {
    try {
      const { question, answer } = req.body;
      if (!question) {
        throw new Exception("ValidationError", "Reviews not found");
      }
      if (!answer) {
        throw new Exception("ValidationError", "Reviews not found");
      }
      const addFaq = await new FaqModel().faq(req.body).save();
      if (addFaq) {
        res.sendResponse("Data Has addded Succesfully");
      }
    } catch (err) {
      res.status(400).send(err.message);
    }
  }

  static async updateMainFaq(req, res) {
    try {
      const { faqId } = req.params;

      if (!faqId) {
        throw new Exception("ValidationError", "FaqID not found");
      }

      const updateFaq = await new FaqModel().faq
        .updateOne({ _id: faqId }, req.body)
        .lean();
      if (updateFaq && !updateFaq.nModified) {
        // throw an erorr update unsuccessfull
      }
      res.sendResponse("Faq updated Successfully");
    } catch (err) {
      res.status(400).send(err.message);
    }
  }

  static async deleteMainFaq(req, res) {
    try {
      const { faqId } = req.params;
      if (!faqId) {
        throw new Exception("ValidationError", "FaqID not found");
      }
      const deleteFaq = await new FaqModel().faq
        .deleteOne({ _id: faqId })
        .lean();

      if (deleteFaq.deletedCount) {
        res.sendResponse("Faq Deleted Succesfully");
      } else {
        res.status(400).send("Something error.....");
      }
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
}

module.exports = Faq;
