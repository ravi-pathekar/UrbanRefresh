class FaqModel {
  constructor() {
    try {
      this.faq = global.Mongoose.model("faq");
    } catch (e) {
      this.schema = new global.Mongoose.Schema(
        {
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