const UserModel = require("./../user/user.model");
const OrderModel = require("./orders.model");
const SubCategoryModel = require("./../serviceSubCategory/serviceSubCategory.model");
const ServiceProviderModel = require("./../serviceProvider/serviceProvider.model");
const MembershipModel = require("./../memberships/membership.model");
const CouponModel = require("./../coupon/coupon.model");

class Order {
  static async addOrder(req, res) {
    try {
      const {
        servicesOrdered,
        deliveryDate,
        deliveryTime,
        orderNote,
        couponId
      } = req.body;

      // await Order.checkDeliveryMonth(deliveryDate);

      // get customerId from validation token
      const customerId = "5fe0dc2e13f41353b584dacf";

      let newOrderNumbers = 1;
      let orderData = {};

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

      const customerValidation = await Order.validateCustomerDetails(
        customerId
      );

      if (!customerValidation) {
        throw new Exception("UnAuthorizedUser");
      }

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
        console.log("  serviceSubCategoryDetails.serviceSubCategoryName")
        // service Details
        z.serviceSubCategoryName =
          serviceSubCategoryDetails.serviceSubCategoryName;
        z.serviceCategoryId =
          serviceSubCategoryDetails["serviceCategoryId"]._id;
        z.price = serviceSubCategoryDetails.price[0].prices;
        z.serviceId =
          serviceSubCategoryDetails.serviceCategoryId.parentServiceId._id;
        z.serviceProviderName = serviceProvider[0].serviceProviderName;
        serviceOrderedObj.note = servicesOrdered[i].note;

        // Merge Objects
        serviceOrderedObj.serviceDetails = z;

        serviceOrderedObj.serviceSubCategoryId =
          servicesOrdered[i].serviceSubCategoryId;
        //  console.log("serviceOrderedObj serviceOrderedObj",serviceOrderedObj)
        subTotal +=
          serviceSubCategoryDetails.price[0].prices *
          servicesOrdered[i].quantity;
        console.log("\n\nSerrviceorderedObj",serviceOrderedObj)
        orderServices.push(serviceOrderedObj);
        console.log("orderServices:::",orderServices)
      }

      // Provider Detail
      if (serviceProvider.length) {
        serviceProviderDetails.providerName =
          serviceProvider[0].serviceProviderName;
        serviceProviderDetails.contactNumber = serviceProvider[0].contactNumber;
        serviceProviderDetails.serviceProviderId = serviceProvider[0]._id;
      }

      orderData.orderNumber = newOrderNumbers;
      orderData.userDetails = customerValidation;
      orderData.orderNote = orderNote;
      orderData.serviceProviderDetails = serviceProviderDetails;
      orderData.servicesOrdered = orderServices;

      const membershipDiscount = await Order.checkUserMembership(
        customerValidation.customerMembershipId
      );
      if (membershipDiscount) {
        orderData.membershipDiscount = membershipDiscount;
        subTotal = subTotal - membershipDiscount;
      }

      if (couponId) {
        const couponDiscount = await Order.checkCoupon();
        if (couponDiscount) {
          orderData.couponValue = couponDiscount;
          subTotal = subTotal - couponDiscount;
          orderData.couponsApplied = couponId;
        }
      }
      orderData.totalPrice = subTotal;

      await Order.setBookingDateInServiceProvider(
        deliveryUnixtime,
        serviceProvider[0]._id
      );
      orderData.deliveryDate = deliveryDate;
      const createOrder = await new OrderModel(orderData).save();
      if (!createOrder) {
        throw new Exception("OrderError");
      }
      res.sendResponse(createOrder);
    } catch (err) {
      res.status(400).send(err);
    }
  }

  static async validateCustomerDetails(customerId) {
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
    if (customer && customer.address) {
      customerDetails.deliveryAddress = customer.address;
    }
    customerDetails.customerMembershipId = customer.membershipType.membershipId;

    return customerDetails;
  }

  static async getServiceSubCategoryDetails(categoryId, serviceProviderDetail) {
    const getSubCategory = await SubCategoryModel.findOne({
      _id: categoryId
    }).populate({
      path: "serviceCategoryId",
      populate: { path: "parentServiceId" }
    });

    // const
    // const providrCity = serviceProviderDetail[0].address.cityId;
    // const serviceCities =
    //   getSubCategory.serviceCategoryId.parentServiceId.cities;
    if (!getSubCategory) {
      throw new Exception(
        "ObjectNotFound",
        "Service Sub Category not match in our database.."
      );
    }

    // const check = serviceCities.map(service => {
    //   if (service === providrCity) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // });
    // console.log("CHECKKKKKKKKKKKKKKKKK:::", check);
    // if (!check) {
    //   throw new Exception("NotInSameCityError");
    // }
    return getSubCategory;
  }

  static async checkServiceProvider(servicesOrdered, deliveryDate) {
    const getServiceId = await SubCategoryModel.findOne({
      _id: servicesOrdered.serviceSubCategoryId
    }).populate("serviceCategoryId");

    const serviceId = getServiceId.serviceCategoryId.parentServiceId;

    const getproviders = await ServiceProviderModel.find({
      $and: [
        {
          services: { $in: [serviceId] },
          bookedon: { $exists: true, $nin: [deliveryDate] }
        }
      ]
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
    // if(!membership){}
    return membership.MembershipDiscount;
  }

  static async getCustomerOrder(req, res) {
    try {
      // getCustomerId via user login token
      const customerId = "5fe0dc2e13f41353b584dacf";

      const customerValidation = await Order.validateCustomerDetails(
        customerId
      );

      if (!customerValidation) {
        throw new Exception("UnAuthorizedUser");
      }

      const orders = await OrderModel.find({
        "userDetails.userId": customerValidation.userId
      })
        .lean()
        .sort({ orderNumber: -1 });

      if (!orders.length) {
        res.sendResponse("No items in the cart", res);
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
    const cId = "5fe1a5c4481d0e5a1e391ebc";
    const getCoupon = await CouponModel.findOne({ _id: cId });

    if (Date.now() > Date.parse(getCoupon.endTime)) {
      throw new Exception("CouponExpire");
    }
    return getCoupon.couponValue;
  }

  // static async checkDeliveryMonth(deliveryDate) {
  //   console.log("DELIVERRYYY DATEEE", deliveryDate);
  //   const currentDate = await Order.getCurrentDate();
  //   const inUnixTime = new Date(deliveryDate).getTime()/1000;
  //   const dateAfter60Days = currentDate + 1000 * 60 * 60 * 24 * 60;
  //   console.log("%%%%%%%", dateAfter60Days);

  //   console.log(
  //     " currentDate < inUnixTime",
  //     currentDate < inUnixTime && dateAfter60Days > inUnixTime
  //   );
  //   console.log("dateAfter60Days > inUnixTime", dateAfter60Days < inUnixTime);
  //   console.log("---334-----",currentDate < inUnixTime && dateAfter60Days < inUnixTime);
  //   // if (currentDate < deliveryUnixtime && dateAfter60Days < inUnixTime) {
  //   // }
  // }
}

module.exports = Order;
