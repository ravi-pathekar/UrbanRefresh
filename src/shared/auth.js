// let future = new Date();
// future.setDate(future.getDate() + 30);
// console.log("30 date------------->", future);

// const currentDate = new Date();
// const fdate = currentDate.setDate(currentDate.getDate() + 30);

// console.log("currentDate------------->", fdate);

const Sssc = require("../modules/serviceSubCategory/serviceSubCategory.model");

async function ssssc() {
  const result = await Sssc.findOne({ _id: "5fddd4666987023e81c0ff37" }).lean();
  console.log("ssssc------------14---------->", result);
}

ssssc();
