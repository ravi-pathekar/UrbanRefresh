const nodeMailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

module.exports = {
  sendMail: async (to, subject, html) => {
    try {
      const mailObject = { to, from: process.env.FROM_MAIL, subject, html };
      await transporter.sendMail(mailObject);
    } catch (error) {
      console.log(error);
    }
  },
};
