const serviceFaqModel = require("./serviceFaq.model");
const { sendResponse, errorResponse } = require("../../shared/handleRequest");

class ServiceFaq {
  static async getAllFaq(req, res) {
    try {
      const { serviceId } = req.params;
      const faq = await new serviceFaqModel().faqServices
        .find({ serviceId: serviceId })
        .lean();
      if (!faq) {
        // throw an error
        // throw new global.Exception("Faq");
      }
      if (!faq.length) {
        sendResponse("Sorry there are no Faq");
      }
      res.sendResponse(faq);
      // res.status(200).send(faq);
    } catch (err) {
      res.status(400).send(err.message);
      // res.status(400).send(err);
    }
  }

  static async addMainFaq(req, res) {
    try {
      const { question, serviceId, answer } = req.body;
      if (!question) {
        // throw error
      }
      if (!answer) {
        // throw error
      }
      if (!serviceId) {
        // throw error
      }

      const addServiceFaq = await new serviceFaqModel()
        .faqServices(req.body)
        .save();
      if (!addServiceFaq) {
        // throw error
      }

      res.sendResponse("Faq Has addded Succesfully");
      // res.status(201).send("Data Has addded Succesfully");
    } catch (err) {
      res.status(400).send(err.message);
      // res.status(400).send(err);
    }
  }

  static async deleteServiceFaq(req, res) {
    try {
      const { faqId } = req.params;
      const deleteFaq = await new serviceFaqModel().faqServices
        .deleteOne({ _id: faqId })
        .lean();

      if (!deleteFaq.deletedCount) {
        throw new global.Exception("Faq");
      }
      res.sendResponse("Faq Has Deleted Succesfully");
      // res.status(200).send("Faq Deleted Succesfully");
    } catch (err) {
      res.status(400).send(err.message);

      // res.status(400).send(err);
    }
  }
}

module.exports = ServiceFaq;
