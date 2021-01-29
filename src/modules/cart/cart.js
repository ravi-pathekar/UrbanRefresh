const createError = require("http-errors");
const CartModel = require("../cart/cart.model");
const { cartValidate } = require("../../shared/validationSchema");
const UserModel = require("../user/user.model");
const CouponModel = require("../coupon/coupon.model");

class Cart {
  static async addToCart(req, res, next) {
    try {
      const userId = req.payload.aud;
      let result = await cartValidate.validateAsync(req.body);
      result.userId = userId;
      result.couponApplied = result.couponApplied ? result.couponApplied : null;
      const doesExist = await CartModel.findOne({
        userId: userId,
      }).lean();
      let updatedCart = null;
      if (
        doesExist &&
        doesExist.serviceCategoryId == result.serviceCategoryId
      ) {
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
                userId: userId,
                "cartItems.serviceSubCategoryId":
                  classCartItems[i].serviceSubCategoryId,
              },
              {
                $set: {
                  "cartItems.$.quantity": result.cartItems[0].quantity,
                  couponApplied: result.couponApplied,
                },
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
              userId: userId,
              serviceCategoryId: result.serviceCategoryId,
            },
            {
              $push: {
                cartItems: {
                  serviceSubCategoryId:
                    result.cartItems[0].serviceSubCategoryId,
                  quantity: result.cartItems[0].quantity,
                  note: result.cartItems[0].note,
                  pricePerItem: result.cartItems[0].pricePerItem,
                },
              },
              $set: { couponApplied: result.couponApplied },
            },
            { new: true }
          );
        }
      } else if (
        doesExist &&
        doesExist.serviceCategoryId != result.serviceCategoryId
      ) {
        updatedCart = await CartModel.findOneAndUpdate(
          {
            userId: userId,
          },
          {
            $set: {
              serviceCategoryId: result.serviceCategoryId,
              cartItems: result.cartItems,
              couponApplied: result.couponApplied,
            },
          },
          { new: true }
        );
      } else {
        updatedCart = await CartModel.create(result);
      }

      const totalPrice = await Cart.calculatePrice(updatedCart, userId, result);

      res.sendResponse({ updatedCart, totalPrice });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  }

  static async calculatePrice(updatedCart, userId, result) {
    const { cartItems } = updatedCart;
    let totalPrice = 0;
    for (let i = 0; i < cartItems.length; i++) {
      let total = cartItems[i].quantity * cartItems[i].pricePerItem;
      totalPrice = totalPrice + total;
    }

    const userDiscount = await UserModel.findOne({
      _id: userId,
    })
      .populate("membershipId")
      .select("membershipId -_id");

    const membershipDiscount =
      userDiscount &&
      userDiscount.membershipId &&
      userDiscount.membershipId.membershipDiscount
        ? userDiscount.membershipId.membershipDiscount
        : 0;

    let couponValue = 0;
    if (result.couponApplied) {
      const coupon = await CouponModel.findOne({
        _id: result.couponApplied,
        isActive: true,
      }).select("couponValue");
      couponValue = coupon["couponValue"];
    }

    totalPrice = totalPrice - (membershipDiscount + couponValue);
    return totalPrice;
  }

  static async decreaseItemQuantity(req, res, next) {
    try {
      const userId = req.payload.aud;

      const { serviceCategoryId, serviceSubCategoryId, quantity } = req.body;

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
      const userId = req.payload.aud;
      const { serviceCategoryId, serviceSubCategoryId } = req.body;

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
      const userId = req.payload.aud;

      const { serviceCategoryId } = req.body;

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
