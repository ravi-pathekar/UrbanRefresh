const createError = require("http-errors");
const UserModel = require("./../user/user.model");
const OrderModel = require("./order.model");
const ServiceSubCategoryModel = require("./../serviceSubCategory/serviceSubCategory.model");
const ServiceProviderModel = require("./../serviceProvider/serviceProvider.model");
const MembershipModel = require("./../membership/membership.model");
const CouponModel = require("./../coupon/coupon.model");
const templatesDir = `${__dirname}/../../../templates`;
const ejs = require("ejs");
const { sendMail } = require("../../shared/mailer");
const { sendMessage } = require("../../shared/textMessage");

class Order {
  static async addOrder(req, res, next) {
    try {
      const {
        servicesOrdered,
        deliveryDate,
        deliveryTime,
        orderNote,
        couponApplied,
        isDefaultAddress,
        customAddress,
      } = req.body;
      const userId = req.payload.aud;

      if (servicesOrdered.length > 5) {
        throw createError.NotAcceptable("Only 5 Items accepted in one order");
      }

      await Order.__checkDeliveryMonth(deliveryDate);

      let orderData = {};
      const orderedServices = [];
      let subTotal = 0;

      const deliveryUnixDate = new Date(deliveryDate).getTime() / 1000;
      const currentDate = await Order.__getCurrentDate();
      if (currentDate > deliveryUnixDate) {
        throw createError.NotAcceptable(
          "Delivery date should be greater than current date."
        );
      }

      const userDetails = await Order.__addUserDetails(
        userId,
        isDefaultAddress,
        customAddress
      );

      const serviceDetail = await ServiceSubCategoryModel.findOne({
        _id: servicesOrdered[0].serviceSubCategoryId,
      }).populate({
        path: "serviceCategoryId",
      });
      if (!serviceDetail) {
        throw createError.NotFound("No Profucts Found!!!");
      }
      orderData.serviceCategoryId = serviceDetail.serviceCategoryId._id;
      orderData.serviceId = serviceDetail.serviceCategoryId.parentServiceId;

      let serviceProviderDetails = await Order.__getServiceProvider(
        orderData.serviceId,
        userDetails.deliveryAddress.city,
        deliveryUnixDate
      );

      for (let i = 0; i < servicesOrdered.length; i++) {
        const {
          serviceSubCategoryId,
          quantity,
          note,
          isVariantPrice,
          pricePerItem,
        } = servicesOrdered[i];
        let servicesOrderedObj = {};

        const serviceSubCategoryDetails = await Order.__getServiceSubCategoryDetails(
          serviceSubCategoryId
        );
        const {
          serviceSubCategoryName,
          image,
          description,
        } = serviceSubCategoryDetails;

        servicesOrderedObj.serviceSubCategoryId = serviceSubCategoryId;
        servicesOrderedObj.serviceSubCategoryName = serviceSubCategoryName;
        servicesOrderedObj.image = image;
        servicesOrderedObj.description = description;
        servicesOrderedObj.quantity = quantity;
        servicesOrderedObj.note = note;
        servicesOrderedObj.isVariantPrice = isVariantPrice;
        servicesOrderedObj.pricePerItem = parseInt(pricePerItem);

        subTotal += parseInt(pricePerItem) * parseInt(quantity);

        orderedServices.push(servicesOrderedObj);
      }

      orderData.membershipDiscount = 0;
      if (userDetails.userMembershipId) {
        const membershipDiscount = await Order.__checkUserMembership(
          userDetails.userMembershipId
        );
        orderData.membershipDiscount = membershipDiscount;
        subTotal = subTotal - membershipDiscount;
      }

      orderData.couponValue = 0;
      orderData.couponApplied = null;
      if (couponApplied) {
        const couponDiscount = await Order.__checkCoupon(
          couponApplied,
          orderData.serviceCategoryId
        );
        orderData.couponValue = couponDiscount;
        subTotal = subTotal - couponDiscount;
        orderData.couponApplied = couponApplied;
      }

      const getOrders = await OrderModel.findOne()
        .sort({ orderNumber: -1 })
        .select("orderNumber");
      let nextOrder = getOrders ? parseInt(getOrders.orderNumber) + 1 : 1;

      orderData.userDetails = userDetails;
      orderData.orderNumber = nextOrder;
      orderData.orderNote = orderNote;
      orderData.serviceProviderDetails = serviceProviderDetails;
      orderData.servicesOrdered = orderedServices;
      orderData.deliveryDate = deliveryDate;
      orderData.deliveryTime = deliveryTime;
      orderData.totalPrice = subTotal;

      const addOrder = await new OrderModel(orderData).save();
      if (!addOrder) {
        throw createError.InternalServerError();
      }
      await Order.__updateServiceProvider(
        addOrder._id,
        deliveryUnixDate,
        serviceProviderDetails.serviceProviderId
      );
      await Order.__sendOrderMail(addOrder);
      // await Order.__sendOrderMessage(addOrder);
      res.sendResponse(addOrder);
    } catch (err) {
      next(err);
    }
  }

  static async __addUserDetails(
    userId,
    isDefaultAddress = false,
    customAddress
  ) {
    const user = await UserModel.findOne({
      _id: userId,
    });
    if (!user) {
      throw createError.Unauthorized();
    }
    let userDetails = {};
    userDetails.userId = user._id;
    userDetails.userName = user.firstName + " " + user.lastName;
    userDetails.userEmail = user.email;
    userDetails.contactNumber = user.contactNumber;
    userDetails.deliveryAddress = isDefaultAddress
      ? user.address
      : customAddress;
    userDetails.userMembershipId = user.isActive ? user.membershipId : null;
    return userDetails;
  }

  static async __getServiceSubCategoryDetails(serviceSubCategoryId) {
    const serviceSubCategoryDetails = await ServiceSubCategoryModel.findOne({
      _id: serviceSubCategoryId,
    });
    if (!serviceSubCategoryDetails) {
      throw createError.NotFound("No Profucts Found!!!");
    }

    return serviceSubCategoryDetails;
  }

  static async __getServiceProvider(serviceId, serviceCity, deliveryUnixDate) {
    let serviceProvider = {};
    const serviceID = serviceId.toString();
    const deliveryDate = deliveryUnixDate.toString();
    const getproviders = await ServiceProviderModel.aggregate([
      {
        $match: {
          $and: [
            { services: { $in: [serviceID] } },
            { servingCity: serviceCity },
            { "bookedFor.deliveryDate": { $nin: [deliveryDate] } },
          ],
        },
      },
      {
        $project: {
          serviceProviderName: 1,
          contactNumber: 1,
          bookedFor: { $size: "$bookedFor" },
        },
      },
      { $sort: { bookedFor: 1 } },
      { $limit: 1 },
    ]);
    if (!getproviders.length) {
      throw createError.Conflict(
        `All Service Provider are busy in this region on ${deliveryDate} `
      );
    }
    const { _id, serviceProviderName, contactNumber } = getproviders[0];
    serviceProvider.serviceProviderId = _id;
    serviceProvider.providerName = serviceProviderName;
    serviceProvider.contactNumber = contactNumber;

    return serviceProvider;
  }

  static async __updateServiceProvider(orderId, deliveryDate, providerId) {
    const updatedProvider = await ServiceProviderModel.findOneAndUpdate(
      { _id: providerId },
      {
        $push: {
          bookedFor: {
            orderId: orderId,
            deliveryDate: deliveryDate,
          },
        },
      }
    );
    if (!updatedProvider) {
      throw createError.InternalServerError();
    }
    return updatedProvider;
  }

  static async __checkUserMembership(membershipId) {
    try {
      const membership = await MembershipModel.findOne({
        _id: membershipId,
      }).lean();
      if (!membership) {
        console.log("This membership doesn't exist!!!");
      }
      let membershipDiscount =
        membership && membership.membershipDiscount
          ? membership.membershipDiscount
          : 0;
      return membershipDiscount;
    } catch (error) {
      console.log(error);
    }
  }

  static async __getCurrentDate() {
    const utc = new Date().toJSON().slice(0, 10).replace(/-/g, "/");
    const currentUnixDate = new Date(utc).getTime() / 1000;
    return currentUnixDate;
  }

  static async __checkCoupon(couponId, serviceCategoryId) {
    const couponDetails = await CouponModel.findOne({
      _id: couponId,
      isActive: true,
      serviceCategoryId: serviceCategoryId,
    });

    let couponValue =
      couponDetails && couponDetails.couponValue
        ? couponDetails.couponValue
        : 0;

    return couponValue;
  }

  static async __checkDeliveryMonth(deliveryDate) {
    const currentDate = await Order.__getCurrentDate();
    const inUnixTime = new Date(deliveryDate).getTime() / 1000;
    const dateAfter30Days = currentDate + 60 * 60 * 24 * 30;

    if (currentDate < inUnixTime && dateAfter30Days < inUnixTime) {
      throw createError.NotAcceptable(
        "We don't accept order for more than 30 days!!!"
      );
    }
  }

  // static async convertUnixToRealTime(unixDate) {
  //   const inUnixTime = new Date(unixDate * 1000);
  // }

  static async getOrder(req, res, next) {
    try {
      const userId = req.payload.aud;
      const orders = await OrderModel.find({
        "userDetails.userId": userId,
      })
        .lean()
        .sort({ orderNumber: -1 });

      !orders.length
        ? res.sendResponse("No Orders!!!", 404)
        : res.sendResponse(orders);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      const userId = req.payload.aud;
      const { Status } = req.body;
      const { orderId } = req.params;
      const statusCode = [0, 1, 2, 3];

      if (Status === 5) {
        const orderDetail = await OrderModel.findOne({
          $and: [
            { _id: orderId },
            { "userDetails.userId": userId },
            { orderStatus: { $in: statusCode } },
          ],
        }).lean();

        if (!orderDetail) {
          throw createError.BadRequest(
            "This order not found or already been cancelled!!!"
          );
        }

        await Order.__cancelOrder(orderDetail);
        await Order.__sendCancelOrderMail(orderDetail);
      }

      const updatedOrderStatus = await OrderModel.findOneAndUpdate(
        { $and: [{ _id: orderId }, { "userDetails.userId": userId }] },
        { $set: { orderStatus: Status } },
        { new: true }
      );
      if (!updatedOrderStatus) {
        throw createError.InternalServerError();
      }
      res.sendResponse("Status updated Successfully");
    } catch (err) {
      next(err);
    }
  }

  static async __cancelOrder(orders) {
    try {
      let {
        _id: orderId,
        deliveryDate,
        serviceProviderDetails: { serviceProviderId } = {
          serviceProviderId: null,
        },
      } = orders;

      const utc = new Date(deliveryDate)
        .toJSON()
        .slice(0, 10)
        .replace(/-/g, "-");
      deliveryDate = new Date(utc).getTime() / 1000;

      const updatedProviderDetails = await ServiceProviderModel.findOneAndUpdate(
        {
          $and: [
            { _id: serviceProviderId },
            {
              "bookedFor.deliveryDate": { $exists: true, $in: [deliveryDate] },
            },
          ],
        },
        { $pull: { bookedFor: { orderId: orderId } } },
        { new: true }
      );
    } catch (error) {
      console.log(error);
    }
  }

  static async __sendOrderMessage(order) {
    let {
      orderNumber,
      deliveryDate,
      deliveryTime,
      serviceProviderDetails,
      userDetails,
    } = order;
    deliveryDate = deliveryDate.toString().substring(0, 10);

    const body = `Your order with Order No. ${orderNumber} has been placed on ${deliveryDate}.
    ${serviceProviderDetails.providerName} will be at your door at ${deliveryTime}. 
    Team Urban Refresh.`;
    const to_msg = userDetails.contactNumber;

    sendMessage(body, to_msg);
  }

  static async __sendOrderMail(order) {
    const html = await ejs.renderFile(templatesDir + "/order/place-order.ejs", {
      order: order,
    });

    sendMail(order.userDetails.userEmail, "Order Placed", html);
  }

  static async __sendCancelOrderMail(order) {
    const html = await ejs.renderFile(
      templatesDir + "/order/cancel-order.ejs",
      { order: order }
    );

    sendMail(order.userDetails.userEmail, "Order Cancelled", html);
  }
}

module.exports = Order;
