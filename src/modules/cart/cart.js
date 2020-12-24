const createError = require("http-errors");
const CartModel = require("../cart/cart.model");
const { cartCheck } = require("../../shared/validationSchema");
const UserModel = require("../user/user.model");
const CouponModel = require("../coupon/coupon.model");

class Cart {
  static async addToCart(req, res, next) {
    try {
      const result = await cartCheck.validateAsync(req.body);
      const doesExist = await CartModel.findOne({
        userId: result.userId,
      }).lean();
      let updatedCart = null;
      if (doesExist) {
        console.log(
          "Output---------------------------> ~ file: cart.js ~ line 16 ~ Cart ~ addToCart ~ doesExist",
          doesExist
        );
        let classCartItems = doesExist.cartItems;

        for (let i = 0; i < classCartItems.length; i++) {
          if (
            classCartItems[i].serviceSubCategoryId ==
            result.cartItems[0].serviceSubCategoryId
          ) {
            if (classCartItems[i].quantity === 5) {
              throw createError.NotAcceptable(
                "Product quantity should not be greater than 5!!!"
              );
            }
            updatedCart = await CartModel.findOneAndUpdate(
              {
                userId: result.userId,
                "cartItems.serviceSubCategoryId":
                  classCartItems[i].serviceSubCategoryId,
              },
              {
                $inc: { "cartItems.$.quantity": 1 },
              },
              { new: true }
            );
          }
        }

        if (!updatedCart) {
          if (classCartItems.length === 5) {
            throw createError.NotAcceptable(
              "You can add only upto 5 items in your cart"
            );
          }
          updatedCart = await CartModel.findOneAndUpdate(
            { userId: result.userId },
            {
              $push: {
                cartItems: {
                  serviceSubCategoryId:
                    result.cartItems[0].serviceSubCategoryId,
                  quantity: 1,
                  note: result.cartItems[0].note,
                  pricePerItem: result.cartItems[0].pricePerItem,
                },
              },
            },
            { new: true }
          );
        }
      } else {
        updatedCart = await CartModel.create(req.body);
      }

      const totalPrice = await Cart.calculatePrice(updatedCart, result);

      res.sendResponse({ updatedCart, totalPrice });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  }

  static async calculatePrice(updatedCart, result) {
    const { cartItems } = updatedCart;
    console.log(
      "Output---------------------------> ~ file: cart.js ~ line 76 ~ Cart ~ calculatePrice ~ cartItems",
      cartItems.length
    );
    let totalPrice = 0;
    console.log(
      "Output---------------------------> ~ file: cart.js ~ line 75 ~ Cart ~ calculatePrice ~ totalPrice",
      totalPrice
    );
    for (let i = 0; i < cartItems.length; i++) {
      let total = cartItems[i].quantity * cartItems[i].pricePerItem;

      totalPrice = totalPrice + total;
    }

    const userDiscount = await UserModel.findOne({
      _id: result.userId,
    })
      .populate("membershipId")
      .select("membershipId -_id");
    console.log(
      "Output---------------------------> ~ file: cart.js ~ line 83 ~ Cart ~ calculatePrice ~ userDiscount",
      Object.keys(userDiscount)
    );

    const membershipDiscount =
      userDiscount.hasOwnProperty("membershipId") &&
      userDiscount.membershipId.membershipDiscount;

    const coupon = await CouponModel.findOne({
      _id: result.couponApplied,
    }).select("couponValue");

    const couponValue = coupon["couponValue"];

    totalPrice = totalPrice - (membershipDiscount + couponValue);
    return totalPrice;
  }
}

module.exports = Cart;
