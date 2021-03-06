const mongoose = require("mongoose");

class Mongo {
  constructor() {
    this.connectDB();
  }

  connectDB() {
    this.uri = process.env.MONGODB_URI;

    const options = {
      dbName: process.env.DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    };

    const debug = true;

    if (debug) {
      mongoose.set("debug", { color: true });
    } else {
      mongoose.set("debug", false);
    }

    global.Mongoose = mongoose;

    mongoose
      .connect(this.uri, options)
      .then(() => console.log("MongoDB Connected..."))
      .catch((err) => console.log(err.message));

    return mongoose;
  }
}

module.exports = Mongo;
