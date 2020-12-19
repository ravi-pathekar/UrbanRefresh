const CartModel = require("./cart.model");
const serviceSubCategoryModel = require("./../serviceSubCategory/serviceSubCategory.model");

class Cart {
  static async addProductToCart(req, res) {
    const { ServiceId, Quantity, customerId } = req.body;

    if (!ServiceId) {
      res.status(400).send("Valiation Failed: ServiceId doesn't Exist");
    }
    if (Quantity <= 0) {
      res.status(400).send("Quantity must be greater than zero");
    }

    if (!Quantity) {
      res.status(400).send("Valiation Failed: Quantity");
    }

    const service = await new serviceSubCategoryModel().serviceSubCategory
      .findOne({ _id: ServiceId })
      .lean();

    if (!service) {
      console.log("Services not found");
    }

    const customerCart = await new CartModel().cart
      .findOne({ CustomerId: customerId })
      .lean();

    if (customerCart) {
      const arr = customerCart.CartItems;
      arr.push(req.body);
      const updatedCart = await new CartModel().cart
        .findOneAndUpdate(
          { CustomerId: customerId },
          { $set: { CartItems: arr } }
        )
        .lean();

      console.log("UPDATED CARTTT::", updatedCart);
    } else {
      const cart = {
        CustomerId: customerId,
        CartItems: [req.body]
      };
      const updatedCart = await new CartModel().cart(cart).save();
    }
    res.status(200).send("Service Has been added in the Cart");
  }

  static async getCustomerCart(req, res) {
    // get customer id from cookies
    const customerId = "5fbcc4cd2780d839d543486e";
    const customerCart = await new CartModel().cart
      .findOne({ CustomerId: customerId })
      .lean();

    res.status(200).send(customerCart);
  }

  static async updateCustomerCart(req, res) {
    // get authenticate customer id from cookies
    const customerId = "5fbcc4cd2780d839d543486e";
    const { cartItemId } = req.params;

    const customerCart = await new CartModel().cart
      .findOneAndUpdate(
        { CustomerId: customerId, "CartItems._id": cartItemId },
        { $set: { CartItems: req.body } }
      )
      .lean();

    res.send(req.params);
  }

  static async removeItemFromCart(req, res) {
    const customerId = "5fbcc4cd2780d839d543486e";
    const { cartItemId } = req.params;
    const customerCart = await new CartModel().cart
      .findOneAndUpdate(
        { CustomerId: customerId },
        { $pull: { CartItems: { _id: { $in: cartItemId } } } }
      )
      .lean();

    res.send("Items Remove from cart");
  }
}

module.exports = Cart;
