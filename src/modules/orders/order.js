const UserModel = require("./../user/user.model");
const OrderModel = require("./orders.model");
const SubCategoryModel = require("./../serviceSubCategory/serviceSubCategory.model");
const ServiceProviderModel = require("./../serviceProvider/serviceProvider.model");
const MembershipModel = require("./../memberships/membership.model");
const CouponModel = require("./../coupon/coupon.model");
const CityModel = require("./../cities/cities.model");

class Order {
  static async addOrder(req, res) {
    try {
      const {
        servicesOrdered,
        deliveryDate,
        deliveryTime,
        orderNote,
        couponId,
        address
      } = req.body;

      // get customerId from validation token
      const customerId = "5fe0dc2e13f41353b584dacf";

      let newOrderNumbers = 1;
      let orderData = {};
      let alertObj = {};
      const deliveryUnixtime = new Date(deliveryDate).getTime() / 1000;
      const currentDate = await Order.getCurrentDate();

      if (currentDate > deliveryUnixtime) {
        throw new Exception("DeliveryTimeError");
      }

      if (servicesOrdered.length > 5) {
        throw new Exception(
          "ValidationError",
          "only Send 5 times in one order"
        );
      }

      const customerDetails = await Order.validateCustomerDetails(
        customerId,
        address
      );

      if (!customerDetails) {
        throw new Exception("UnAuthorizedUser");
      }
      await Order.checkDeliveryMonth(deliveryDate);

      const getOrders = await OrderModel.findOne().sort({ orderNumber: -1 });

      if (getOrders) {
        newOrderNumbers = parseInt(getOrders.orderNumber) + 1;
      }

      const serviceProvider = await Order.checkServiceProvider(
        servicesOrdered[0],
        deliveryUnixtime
      );

      if (!serviceProvider.length) {
        res.sendResponse(
          `All Service Provider are busy in this region on ${deliveryDate} `
        );
      }

      const orderServices = [];
      let z = {};
      let serviceProviderDetails = {};
      let subTotal = 0;

      for (let i = 0; i < servicesOrdered.length; i++) {
        let serviceOrderedObj = {};

        if (servicesOrdered[i].quantity > 5) {
          throw new Exception(
            "ValidationError",
            "only Each ordered services has maximum 5 Quantity"
          );
        }

        const serviceSubCategoryDetails = await Order.getServiceSubCategoryDetails(
          servicesOrdered[i].serviceSubCategoryId,
          serviceProvider
        );

        serviceOrderedObj.quantity = servicesOrdered[i].quantity;

        serviceOrderedObj.serviceSubCategoryName =
          serviceSubCategoryDetails.serviceSubCategoryName;
        orderData.serviceCategoryId =
          serviceSubCategoryDetails["serviceCategoryId"]._id;
        serviceOrderedObj.price = serviceSubCategoryDetails.price[0].prices;
        orderData.serviceId =
          serviceSubCategoryDetails.serviceCategoryId.parentServiceId._id;

        serviceOrderedObj.note = servicesOrdered[i].note;

        serviceOrderedObj.serviceSubCategoryId =
          servicesOrdered[i].serviceSubCategoryId;

        subTotal +=
          serviceSubCategoryDetails.price[0].prices *
          servicesOrdered[i].quantity;

        orderServices.push(serviceOrderedObj);
      }

      if (serviceProvider.length) {
        serviceProviderDetails.providerName =
          serviceProvider[0].serviceProviderName;
        serviceProviderDetails.contactNumber = serviceProvider[0].contactNumber;
        serviceProviderDetails.serviceProviderId = serviceProvider[0]._id;
      }

      orderData.orderNumber = newOrderNumbers;
      orderData.userDetails = customerDetails;
      orderData.orderNote = orderNote;
      orderData.serviceProviderDetails = serviceProviderDetails;
      orderData.servicesOrdered = orderServices;

      if (customerDetails.customerMembershipEndDate) {
        if (currentDate < customerDetails.customerMembershipEndDate) {
          const membershipDiscount = await Order.checkUserMembership(
            customerDetails.customerMembershipId
          );
          if (membershipDiscount) {
            orderData.membershipDiscount = membershipDiscount;
            subTotal = subTotal - membershipDiscount;
          }
        } else {
          alertObj.membershipExpired = "Your membership has expired";
        }
      }

      if (couponId) {
        const couponDiscount = await Order.checkCoupon(couponId);
        if (couponDiscount) {
          orderData.couponValue = couponDiscount;
          subTotal = subTotal - couponDiscount;
          orderData.couponsApplied = couponId;
        }
      }

      orderData.totalPrice = subTotal;
      await Order.convertUnixToRealTime(deliveryUnixtime);
      await Order.setBookingDateInServiceProvider(
        deliveryUnixtime,
        serviceProvider[0]._id
      );
      orderData.deliveryDate = deliveryDate;

      const createOrder = await new OrderModel(orderData).save();
      if (!createOrder) {
        throw new Exception("OrderError");
      }
      res.sendResponse({orderData, alertObj });
    } catch (err) {
      res.status(400).send(err);
    }
  }

  static async validateCustomerDetails(customerId, address) {
    const customer = await UserModel.findOne({
      _id: customerId
    });
    if (!customer) {
      throw new Exception("UnAuthorizedUser");
    }
    let customerDetails = {};
    if (customer && customer._id) {
      customerDetails.userId = customer._id;
    }
    if (customer && customer.firstName) {
      customerDetails.username = customer.firstName + " " + customer.lastName;
    }
    if (customer && customer.email) {
      customerDetails.userEmail = customer.email;
    }
    if (customer && customer.contactNumber) {
      customerDetails.contactNumber = customer.contactNumber;
    }
    if (address) {
      customerDetails.deliveryAddress = address;
    } else {
      customerDetails.deliveryAddress = customer.address;
    }
    if (customer.membershipType) {
      customerDetails.customerMembershipId =
        customer.membershipType.membershipId;
    }
    if (
      customer &&
      customer.membershipType &&
      customer.membershipType.endDate
    ) {
      const utc = customer.membershipType.endDate
        .toJSON()
        .slice(0, 10)
        .replace(/-/g, "/");
      const endDateUnix = new Date(utc).getTime() / 1000;
      customerDetails.customerMembershipEndDate = endDateUnix;
    }
    return customerDetails;
  }

  static async getServiceSubCategoryDetails(categoryId, serviceProviderDetail) {
    const getSubCategory = await SubCategoryModel.findOne({
      _id: categoryId
    }).populate({
      path: "serviceCategoryId",
      populate: { path: "parentServiceId" }
    });

    if (!getSubCategory) {
      throw new Exception(
        "ObjectNotFound",
        "Service Sub Category not match in our database.."
      );
    }

    return getSubCategory;
  }

  static async checkServiceProvider(servicesOrdered, deliveryDate) {
    const getServiceId = await SubCategoryModel.findOne({
      _id: servicesOrdered.serviceSubCategoryId
    }).populate("serviceCategoryId");

    if (!getServiceId) {
    }
    const serviceId = getServiceId.serviceCategoryId.parentServiceId;
    
   
    const getproviders = await ServiceProviderModel.aggregate([
      [
        {
          $match: {
            services: { $in: [serviceId.toString()] },
            bookedon: { $exists: true, $nin: [deliveryDate] }
          }
        },
        {
          $sort: { bookedon: 1 }
        }
      ]
    ]);
    
    getproviders.sort(function (a, b) {
      return a.bookedon.length - b.bookedon.length;
    });

    return getproviders;
  }

  static async setBookingDateInServiceProvider(deliveryDate, providerId) {
    if (!deliveryDate) {
      throw new Exception("ValidationError", "Delivery Date not found");
    }
    const addDate = await ServiceProviderModel.updateOne(
      { _id: providerId },
      { $addToSet: { bookedon: deliveryDate } }
    );
    return addDate;
  }

  static async checkUserMembership(membershipId) {
    const membership = await MembershipModel.findOne({
      _id: membershipId
    }).lean();
    if (!membership) {
      console.log("USer has not taken any Memebership ");
    }
    return membership.MembershipDiscount;
  }

  static async getCustomerOrder(req, res) {
    try {
      // getCustomerId via user login token
      const customerId = "5fe0dc2e13f41353b584dacf";

      const customerDetails = await Order.validateCustomerDetails(customerId);

      if (!customerDetails) {
        throw new Exception("UnAuthorizedUser");
      }

      const orders = await OrderModel.find({
        "userDetails.userId": customerDetails.userId
      })
        .lean()
        .sort({ orderNumber: -1 });

      if (!orders.length) {
        res.sendResponse("No items in the cart");
      }

      res.sendResponse(orders);
    } catch (err) {
      res.status(400).send(err);
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      // get Customer Id as a token
      const userId = "5fe0dc2e13f41353b584dacf";
      const { Status } = req.body;
      const { orderId } = req.params;

      if (Status === 5) {
        const orders = await OrderModel.findOne({
          $and: [{ _id: orderId }, { "userDetails.userId": userId }]
        }).lean();

        if (orders.orderStatus === 5) {
          throw new Exception("OrderError", "Order already cancelled");
        }

        await Order.cancelOrder(orders);
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
      res.status(400).send(err);
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
      throw new Exception(
        "DeliveryDate",
        "Delivery Date not more than 30 days"
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
          { bookedon: { $exists: true, $in: [deliveryDate] } }
        ]
      },
      { $pull: { bookedon: { $in: [deliveryDate] } } }
    );

  }
}

module.exports = Order;







