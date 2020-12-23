const express = require("express");
const router = express.Router();

const Faq = require("./faq");
const serviceFaq = require("./serviceFaq");

router.get("/v1/mainFaq/getAllFaq", Faq.getAllFaq);
router.post("/v1/mainFaq/addFaq", Faq.addMainFaq);
router.put("/v1/mainFaq/:faqId/updateFaq", Faq.updateMainFaq);
router.delete("/v1/mainFaq/:faqId/deleteFaq", Faq.deleteMainFaq);

// Service Faq---
router.get("/v1/faq/service/:serviceId/getServiceFaq", serviceFaq.getAllFaq);
router.post("/v1/faq/service/addServiceFaq",serviceFaq.addMainFaq);
router.delete("/v1/faq/service/:faqId/deleteServiceFaq", serviceFaq.deleteServiceFaq
);

module.exports = router;
