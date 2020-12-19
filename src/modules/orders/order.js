const OrderModel = require("./order.model");

class Order {
  static async addOrder(req, res, next) {
    const savedOrder = await OrderModel.insertMany(req.body);

    res.sendResponse(savedOrder);
  }

  static async getOrder(req, res, next) {
    const allOrders = await OrderModel.find();

    res.sendResponse(allOrders);
  }
}

module.exports = Order;
