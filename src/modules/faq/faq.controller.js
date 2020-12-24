const express = require("express");
const router = express.Router();

const Faq = require("./faq");

router.get("/v1/mainFaq/getAllFaq", Faq.getAllFaq);
router.post("/v1/mainFaq/addFaq", Faq.addMainFaq);
router.put("/v1/mainFaq/:faqId/updateFaq", Faq.updateMainFaq);
router.delete("/v1/mainFaq/:faqId/deleteFaq", Faq.deleteMainFaq);

module.exports = router;
