class FaqModel {
  constructor() {
    try {
      this.faq = global.Mongoose.model("faq");
    } catch (e) {
      this.schema = new global.Mongoose.Schema(
        {
          serviceId: { type: global.Mongoose.Types.ObjectId },
          question: { type: String, required: true },
          answer: { type: String, required: true }
        },
        { timestamps: true }
      );
      this.faq = global.Mongoose.model("faq", this.schema);
    }
  }
}

module.exports = FaqModel;

// const mongoose = require("mongoose");

// const FaqSchema = new mongoose.Schema(
//   {
//     question: { type: String, required: true },
//     answer: { type: String, required: true },
//     serviceId: { type: mongoose.Schema.Types.ObjectId }
//   },
//   {
//     timestamps: true
//   }
// );

// const Faq = mongoose.model("user", FaqSchema);

// module.exports = Faq;
