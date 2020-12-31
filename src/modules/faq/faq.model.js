const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);

const Faq = mongoose.model("faqs", FaqSchema);

module.exports = Faq;
