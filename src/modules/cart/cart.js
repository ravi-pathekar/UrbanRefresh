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
        serviceCategoryId: result.serviceCategoryId,
      }).lean();
      let updatedCart = null;
      if (doesExist) {
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
                $set: { "cartItems.$.quantity": result.cartItems[0].quantity },
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
            {
              userId: result.userId,
              serviceCategoryId: result.serviceCategoryId,
            },
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
    try {
      const { cartItems } = updatedCart;
      let totalPrice = 0;
      for (let i = 0; i < cartItems.length; i++) {
        let total = cartItems[i].quantity * cartItems[i].pricePerItem;
        totalPrice = totalPrice + total;
      }

      const userDiscount = await UserModel.findOne({
        _id: result.userId,
      })
        .populate("membershipId")
        .select("membershipId -_id");

      const membershipDiscount =
        userDiscount &&
        userDiscount.membershipId &&
        userDiscount.membershipId.membershipDiscount
          ? userDiscount.membershipId.membershipDiscount
          : 0;

      const coupon = await CouponModel.findOne({
        _id: result.couponApplied,
      }).select("couponValue");

      const couponValue = coupon["couponValue"];

      totalPrice = totalPrice - (membershipDiscount + couponValue);
      return totalPrice;
    } catch (error) {
      next(error);
    }
  }

  static async decreaseItemQuantity(req, res, next) {
    try {
      const {
        userId,
        serviceCategoryId,
        serviceSubCategoryId,
        quantity,
      } = req.body;

      if (quantity === 0) {
        return await Cart.deleteItemFromCart(req, res, next);
      }

      const decreasedQuantity = await CartModel.findOneAndUpdate(
        {
          userId: userId,
          serviceCategoryId: serviceCategoryId,
          "cartItems.serviceSubCategoryId": serviceSubCategoryId,
        },
        {
          $set: { "cartItems.$.quantity": quantity },
        },
        { new: true }
      );

      res.sendResponse(decreasedQuantity);
    } catch (error) {
      next(error);
    }
  }

  static async deleteItemFromCart(req, res, next) {
    try {
      const { userId, serviceCategoryId, serviceSubCategoryId } = req.body;

      const deletedItem = await CartModel.findOneAndUpdate(
        { userId: userId, serviceCategoryId: serviceCategoryId },
        {
          $pull: { cartItems: { serviceSubCategoryId: serviceSubCategoryId } },
        },
        { new: true }
      );
      if (!deletedItem.cartItems.length) {
        return await Cart.deleteCart(req, res, next);
      }

      const message = "Item successfully deleted!!!";

      res.sendResponse(message, 204, true);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCart(req, res, next) {
    try {
      const { userId, serviceCategoryId } = req.body;

      const deletedCart = await CartModel.findOneAndDelete({
        userId: userId,
        serviceCategoryId: serviceCategoryId,
      });

      if (!deletedCart) throw createError.NotFound();

      const message = "Item successfully deleted!!!";
      res.sendResponse(message, 204, true);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Cart;
