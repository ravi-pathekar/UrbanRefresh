const createError = require("http-errors");
const mongoose = require("mongoose");
const UserModel = require("./../user/user.model");
const OrderModel = require("./order.model");
const ServiceSubCategoryModel = require("./../serviceSubCategory/serviceSubCategory.model");
const ServiceProviderModel = require("./../serviceProvider/serviceProvider.model");
const MembershipModel = require("./../membership/membership.model");
const CouponModel = require("./../coupon/coupon.model");
const templatesDir = `${__dirname}/../../../templates`;
const ejs = require("ejs");

const Nexmo = require("nexmo");

const nodeMailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

const nexmo = new Nexmo({
  apiKey: "3fedf60f",
  apiSecret: "TNgboaoKnEV7ootk",
});

class Order {
  static async addOrder(req, res, next) {
    try {
      const {
        servicesOrdered,
        deliveryDate,
        deliveryTime,
        orderNote,
        couponId,
        isDefaultAddress,
        customAddress,
      } = req.body;

      if (servicesOrdered.length > 5) {
        throw createError.NotAcceptable("Only 5 Items accepted in one order");
      }

      const userId = req.payload.aud;

      let orderData = {};
      let alertObj = {};
      const orderedServices = [];
      let subTotal = 0;

      const deliveryUnixDate = new Date(deliveryDate).getTime() / 1000;
      const currentDate = await Order.getCurrentDate();
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
        populate: { path: "parentServiceId" },
      });
      orderData.serviceCategoryId = serviceDetail.serviceCategoryId._id;
      orderData.serviceId = serviceDetail.serviceCategoryId.parentServiceId._id;

      let serviceProviderDetails = await Order.getServiceProvider(
        orderData.serviceId,
        userDetails.deliveryAddress.city,
        deliveryUnixDate
      );

      await Order.checkDeliveryMonth(deliveryDate);

      for (let i = 0; i < servicesOrdered.length; i++) {
        const {
          serviceSubCategoryId,
          quantity,
          note,
          isVariantPrice,
          pricePerItem,
        } = servicesOrdered[i];

        let servicesOrderedObj = {};
        const serviceSubCategoryDetails = await Order.getServiceSubCategoryDetails(
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

      if (userDetails.userMembershipEndDate) {
        if (currentDate <= userDetails.userMembershipEndDate) {
          const membershipDiscount = await Order.checkUserMembership(
            userDetails.userMembershipId
          );
          delete userDetails.userMembershipEndDate;
          if (membershipDiscount) {
            orderData.membershipDiscount = membershipDiscount;
            subTotal = subTotal - membershipDiscount;
          }
        } else {
          alertObj.membershipExpired = "Your membership has expired";
        }
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
      orderData.deliveryDate = deliveryUnixDate;
      orderData.deliveryTime = deliveryTime;

      if (couponId) {
        const couponDiscount = await Order.checkCoupon(couponId);
        if (couponDiscount) {
          orderData.couponValue = couponDiscount;
          subTotal = subTotal - couponDiscount;
          orderData.couponsApplied = couponId;
        }
      }
      orderData.totalPrice = subTotal;
      console.log("Output---------------------------> ~ file: order.js ~ line 156 ~ Order ~ addOrder ~ orderData", orderData)
      await Order.convertUnixToRealTime(deliveryUnixDate);

      // const createOrder = await new OrderModel(orderData).save();
      // if (!createOrder) {
      //   throw createError.InternalServerError();
      // }
      // await Order.setBookingDateInServiceProvider(
      //   createOrder._id,
      //   serviceProviderDetails.serviceProviderId
      // );
      // await Order.orderNotification_Mail(createOrder);
      // await Order.orderNotification_Message(createOrder);
      // res.sendResponse({ createOrder, alertObj });
      res.sendResponse({});
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

    if (user.membershipId) {
      userDetails.userMembershipId = user.membershipId;
      const utc = user.membershipEndDate
        .toJSON()
        .slice(0, 10)
        .replace(/-/g, "/");
      const endDateUnix = new Date(utc).getTime() / 1000;
      userDetails.userMembershipEndDate = endDateUnix;
    }
    return userDetails;
  }

  static async getServiceSubCategoryDetails(serviceSubCategoryId) {
    const serviceSubCategoryDetails = await ServiceSubCategoryModel.findOne({
      _id: serviceSubCategoryId,
    });

    if (!serviceSubCategoryDetails) {
      throw createError.NotFound("No Profucts Found!!!");
    }

    return serviceSubCategoryDetails;
  }

  static async getServiceProvider(serviceId, serviceCity, deliveryDate) {
    let serviceProvider = {};
    // const getproviders = await ServiceProviderModel.find({
    //   $and: [
    //     {
    //       services: { $in: [serviceId] },
    //       // servingCity: serviceCity,
    //       // bookedFor: { $exists: true, $nin: [deliveryDate] },
    //     },
    //   ],
    // });
    const serviceID = mongoose.Types.ObjectId(serviceId);
    // console.log(
    //   "Output---------------------------> ~ file: order.js ~ line 231 ~ Order ~ getServiceProvider ~ serviceID",
    //   serviceID
    // );

    const getproviders = await ServiceProviderModel.aggregate([
      {
        $match: {
          $and: [
            // { services: { $in: [serviceID] } },
            { "address.city": "bhopal" },
          ],
        },
      },
    ]);
    // console.log(
    //   "Output---------------------------> ~ file: order.js ~ line 233 ~ Order ~ getServiceProvider ~ getproviders",
    //   getproviders
    // );

    if (!getproviders.length) {
      throw createError.Conflict(
        `All Service Provider are busy in this region on ${deliveryDate} `
      );
    }

    getproviders.sort(function (a, b) {
      return a.bookedFor.length - b.bookedFor.length;
    });

    const { _id, serviceProviderName, contactNumber } = getproviders[0];

    serviceProvider.serviceProviderId = _id;
    serviceProvider.providerName = serviceProviderName;
    serviceProvider.contactNumber = contactNumber;

    return serviceProvider;
  }

  static async setBookingDateInServiceProvider(orderId, providerId) {
    if (!orderId) {
      throw new Exception("ValidationError", "Delivery Date not found");
    }
    const addDate = await ServiceProviderModel.updateOne(
      { _id: providerId },
      { $addToSet: { bookedFor: orderId } }
    );

    return addDate;
  }

  static async checkUserMembership(membershipId) {
    const membership = await MembershipModel.findOne({
      _id: membershipId,
    }).lean();
    if (!membership) {
      console.log("User has not taken any Memebership ");
    }
    return membership.membershipDiscount;
  }

  static async getCustomerOrder(req, res, next) {
    try {
      const userId = req.payload.aud;

      const userDetails = await Order.__addUserDetails(userId);

      const orders = await OrderModel.find({
        "userDetails.userId": userDetails.userId,
      })
        .lean()
        .sort({ orderNumber: -1 });

      if (!orders.length) {
        res.sendResponse("No items in the cart");
      }

      !orders.length
        ? res.sendResponse("No items in the cart")
        : res.sendResponse(orders);
    } catch (err) {
      next(err);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      // get Customer Id as a token
      const userId = req.payload.aud;
      const { Status } = req.body;
      const { orderId } = req.params;

      if (Status === 5) {
        const orders = await OrderModel.findOne({
          $and: [{ _id: orderId }, { "userDetails.userId": userId }],
        }).lean();

        if (!orders) {
          console.log("Customer has no order with this id..");
        }
        if (orders.orderStatus === 5) {
          throw new Exception("OrderError", "Order already cancelled");
        }

        await Order.cancelOrder(orders);
        await Order.orderNotification_CancelMail(orders);
      }

      const updateOrderStatus = await OrderModel.updateOne(
        { $and: [{ _id: orderId }, { "userDetails.userId": userId }] },
        { $set: { orderStatus: Status } }
      );

      if (!updateOrderStatus) {
        throw new global.Exception("GeneralError");
      }
      res.sendResponse("Status updated Successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getCurrentDate() {
    const utc = new Date().toJSON().slice(0, 10).replace(/-/g, "/");
    const currentUnixtime = new Date(utc).getTime() / 1000;
    return currentUnixtime;
  }

  static async checkCoupon(couponId) {
    const getCoupon = await CouponModel.findOne({ _id: couponId });

    if (Date.now() > Date.parse(getCoupon.endTime)) {
      throw new Exception("CouponExpire");
    }
    return getCoupon.couponValue;
  }

  static async checkDeliveryMonth(deliveryDate) {
    const currentDate = await Order.getCurrentDate();
    const inUnixTime = new Date(deliveryDate).getTime() / 1000;
    const dateAfter60Days = currentDate + 60 * 60 * 24 * 30;

    if (currentDate < inUnixTime && dateAfter60Days < inUnixTime) {
      throw createError.NotAcceptable(
        "We doesn't accept order for more than 30 days!!!"
      );
    }
  }

  static async convertUnixToRealTime(unixDate) {
    const inUnixTime = new Date(unixDate * 1000);
  }

  static async cancelOrder(orders) {
    const serviceProviderId = orders.serviceProviderDetails.serviceProviderId;

    const utc = new Date(orders.deliveryDate)
      .toJSON()
      .slice(0, 10)
      .replace(/-/g, "-");
    const deliveryDate = new Date(utc).getTime() / 1000;

    const provider = await ServiceProviderModel.findOneAndUpdate(
      {
        $and: [
          { _id: serviceProviderId },
          { bookedon: { $exists: true, $in: [deliveryDate] } },
        ],
      },
      { $pull: { bookedon: { $in: [deliveryDate] } } }
    );
  }

  static async orderNotification_Message(order) {
    // const deliveryDate = order.deliveryDate.toISOString().substring(0, 10);
    // const from = "Vonage APIs";
    // const to = "917905689433";
    // const text = `Hello ${order.userDetails.username}
    //               Service Placed : Your UrbanRefresh service has been placed with order Number ${order.orderNumber} and the  Price has been charged :${order.totalPrice} Your service delivery date by ${deliveryDate}. We will send you an update on service regards`;
    // nexmo.message.sendSms(from, to, text);
  }

  static async orderNotification_Mail(order) {
    const emailTemplate = await ejs.renderFile(
      templatesDir + "/order/place-order.ejs",
      { order: order }
    );

    transporter.sendMail({
      to: "ravipathekar88@gmail.com",
      from: "ravipathekar99@gmail.com",
      subject: "Order Has Been Placeed Succesfully",
      html: emailTemplate,
    });
  }
  static async orderNotification_CancelMail(order) {
    const cancelTemplate = await ejs.renderFile(
      templatesDir + "/order/cancel-order.ejs",
      { order: order }
    );

    transporter.sendMail({
      to: "ravipathekar88@gmail.com",
      from: "ravipathekar99@gmail.com",
      subject: "Order Has Been Cancelled Succesfully",
      html: cancelTemplate,
    });

    // const from = "Vonage APIs";
    // const to = "917905689433";
    // const text = `Hello ${order.userDetails.username}, \nService Cancelled :Your UrbanRefresh service has been cancelled with order Number ${order.orderNumber} as per your request.
    //               `;
    // nexmo.message.sendSms(from, to, text);
  }
}
module.exports = Order;
