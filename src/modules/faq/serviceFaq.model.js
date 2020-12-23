class ServiceFaqModel {
  constructor() {
    try {
      this.faqServices = global.Mongoose.model("faqServices");
    } catch (e) {
      this.schema = new global.Mongoose.Schema(
        {
          serviceId: { type: String, required: true },
          question: { type: String, required: true },
          answer: { type: String, required: true }
        },
        { timestamps: true }
      );
      this.faqServices = global.Mongoose.model("faqServices", this.schema);
    }
  }
}

module.exports = ServiceFaqModel;
