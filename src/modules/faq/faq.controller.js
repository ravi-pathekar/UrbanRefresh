const express = require("express");
const router = express.Router();
const Faq = require("./faq");

router.post("/addFaq", Faq.addFaq);
router.get("/getFaq", Faq.getFaq);

module.exports = router;
