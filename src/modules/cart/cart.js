const CartModel = require("../cart/cart.model");

class Cart {
  static async addToCart(req, res, next) {
    const { userId, cartItems } = req.body;
    const doesExist = await CartModel.findOne({ userId: userId }).lean();
    let updateCart = null;
    if (doesExist) {
      let classCartItems = doesExist.cartItems;

      for (let i = 0; i < classCartItems.length; i++) {
        if (
          classCartItems[i].serviceSubCategoryId ==
          cartItems[0].serviceSubCategoryId
        ) {
          updateCart = await CartModel.findOneAndUpdate(
            {
              userId: userId,
              "cartItems.serviceSubCategoryId":
                classCartItems[i].serviceSubCategoryId,
            },
            { $set: { "cartItems.$.quantity": cartItems[0].quantity } },
            { new: true }
          );
        }
      }

      if (!updateCart) {
        updateCart = await CartModel.findOneAndUpdate(
          { userId: userId },
          {
            $push: {
              cartItems: {
                serviceSubCategoryId: cartItems[0].serviceSubCategoryId,
                quantity: cartItems[0].quantity,
                note: cartItems[0].note,
              },
            },
          },
          { new: true }
        );
      }
      res.sendResponse(updateCart);
    } else {
      const savedCart = await CartModel.insertMany(req.body);
      res.sendResponse(savedCart);
    }
  }
}

module.exports = Cart;
