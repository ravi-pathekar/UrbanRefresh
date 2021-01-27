const twilio = require("twilio");
const client = new twilio(
  process.env.TWILIO_ACC_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
  sendMessage: async (body, to) => {
    try {
      await client.messages.create({
        body: body,
        to: "+919993531964",
        from: "+14159410491",
      });
      console.log(message.sid);
    } catch (error) {
      console.log(error);
    }
  },
};
