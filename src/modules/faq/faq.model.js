const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
    questionType: {
      type: String,
      enum: ["serviceRelated", "websiteRelated"],
      required: true,
    },
    serviceId: {
      type: String,
      required: function () {
        if (this.questionType === "serviceRelated") return true;
      },
    },
  },
  { timestamps: true }
);

const Faq = mongoose.model("faqs", FaqSchema);

module.exports = Faq;
