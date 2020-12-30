const OrderModel = require("./order.model");
const UserModel = require("../user/user.model");
const MembershipModel = require("../memberships/membership.model");
// const CouponModel = require("../coupon/coupon.model");
const ServiceSubCategoryModel = require("../serviceSubCategory/serviceSubCategory.model");
const ServiceProviderModel = require("../serviceProvider/serviceProvider.model");
const ServiceCategoryModel = require("../serviceCategory/serviceCategory.model");

class Order {
  static async addOrder(req, res, next) {
    try {
      // console.log("payload-------------11--------------->", req.payload);
      let orderData = {};
      const {
        userId,
        couponsApplied,
        servicesOrdered,
        note,
        couponValue
      } = req.body;

      //
      const userDetails = await UserModel.findOne({ _id: userId }).lean();
      let serviceCity = userDetails.address.city;
      // const membershipDiscount = await MembershipModel.findOne({
      //   _id: userDetails.membershipId
      // }).select("membershipDiscount -_id");

      orderData.userId = userId;
      orderData.userName = userDetails.firstName + userDetails.lastName;
      orderData.userEmail = userDetails.email;
      orderData.userContactNo = userDetails.contactNumber;
      // orderData.membershipDiscount = membershipDiscount["membershipDiscount"];
      orderData.note = note;
      orderData.couponValue = couponValue;
      orderData.orderStatus = "Pending";

      // const couponValue = await CouponModel.findOne({
      //   _id: couponsApplied,
      // }).select("couponValue -_id");
      // orderData.couponValue = couponValue["couponValue"];

      orderData.servicesOrdered = [];

      let services = servicesOrdered;
      const currentDate = await Order.getCurrentDate();
      // let serviceDetails = {};

      for (let i = 0; i < services.length; i++) {
        const deliveryUnixtime =
          new Date(servicesOrdered[0].deliveryDate).getTime() / 1000;

        if (services[i].quantity > 3) {
          throw new Exception("ValidationError", "Max Quantiy upto 3");
        }
        if (currentDate > deliveryUnixtime) {
          throw new Exception("DeliveryTimeError");
        }

        let orderedService = {};
        orderedService.serviceDetails = {};
        orderedService.serviceProviderDetails = {};
        // let service = []
        let subServiceDetails = await ServiceSubCategoryModel.findOne({
          _id: services[i].serviceSubCategoryId
        }).select("-_id -priceType");

        orderedService.serviceSubCategoryId = services[i].serviceSubCategoryId;

        orderedService.serviceDetails["serviceSubCategoryName"] =
          subServiceDetails.serviceSubCategoryName;

        orderedService.serviceDetails["serviceCategoryId"] =
          subServiceDetails.serviceCategoryId;

        orderedService.serviceDetails["price"] =
          subServiceDetails.price[0].prices;

        orderedService.quantity = services[i].quantity;

        orderedService.note = services[i].note;

        orderedService.deliveryDate = services[i].deliveryDate;

        orderedService.deliveryTime = services[i].deliveryTime;

        let serviceId = await ServiceCategoryModel.findOne({
          _id: subServiceDetails.serviceCategoryId
        }).select("parentServiceId");

        orderedService.serviceDetails["serviceId"] = serviceId.parentServiceId;
        // console.log(
        //   "Output---------------------------> ~ file: order.js ~ line 80 ~ Order ~ addOrder ~ orderedService",
        //   orderedService
        // );

        // Service Provider ---------------------------------------------------->

        const serviceProvider = await Order.checkServiceProvider(
          servicesOrdered[0],
          deliveryUnixtime
        );

        if (!serviceProvider.length) {
          console.log("All Service Provider are busy in this region");
          res.sendResponse(
            `All Service Provider are busy in this region on ${servicesOrdered[0].deliveryDate} `
          );
        }

        const providerDetails = serviceProvider[0];

        providerDetails && providerDetails.serviceProviderName;

        orderedService.serviceProviderDetails["contactNumber"] =
          providerDetails && providerDetails.contactNumber;

        orderedService.serviceDetails["serviceProviderName"] =
          providerDetails && providerDetails.serviceProviderName;
        orderedService.serviceProviderDetails["providerName"] =
          providerDetails && providerDetails.serviceProviderName;

        orderedService;
        orderData.servicesOrdered.push(orderedService);

        const setBookedDate = await Order.setBookingDateInServiceProvider(
          deliveryUnixtime,
          providerDetails._id
        );
      }

      let previousOrder = await OrderModel.findOne()
        .sort({ createdAt: -1, _id: -1 })
        .lean();
      let nextOrder = 1;

      if (previousOrder) {
        nextOrder = previousOrder.orderNo + 1;
        if (nextOrder > 999) {
          nextOrder = 1;
        }
      }

      orderData.orderNo = nextOrder;

      let savedOrder = await OrderModel.insertMany(orderData);

      // let orderResponse = savedOrder[0]
      // console.log("Output---------------------------> ~ file: order.js ~ line 87 ~ Order ~ addOrder ~ orderResponse", orderResponse.servicesOrdered)

      // delete orderResponse.servicesOrdered["serviceDetails"]

      // console.log("Output---------------------------> ~ file: order.js ~ line 91 ~ Order ~ addOrder ~ orderResponse", orderResponse.servicesOrdered)

      // console.log("setBOOKED DATEEEE:::: ::-145", setBookedDate);
      res.sendResponse(savedOrder);
    } catch (err) {
      res.status(400).send(err);
    }
  }

  // static async calculation(req, res, next) {
  //   console.log("calculation----------------100------------>");
  //   let totalPrice = 0;
  //   for (let i = 0; i < cartitems.length; i++) {
  //     let a = cartitems[i].quantity * cartitems[i].price[0].prices;

  //     let b = membershipDiscount;

  //     let c = couponValue;

  //     totalPrice = totalPrice + a - b - c;
  //     console.log(
  //       "Output---------------------------> ~ file: order.js ~ line 109 ~ Order ~ calculation ~ totalPrice",
  //       totalPrice
  //     );
  //   }
  //   res.sendResponse({});
  // }

  // static async getOrder(req, res, next) {
  //   const allOrders = await OrderModel.find();

  //   res.sendResponse(allOrders);
  // }

  static async setBookingDateInServiceProvider(deliveryDate, providerId) {
    if (!deliveryDate) {
      throw new Exception("ValidationError", "Delivery Date not found");
    }
    const addDate = await ServiceProviderModel.update(
      { _id: providerId },
      { $addToSet: { bookedon: deliveryDate } }
    );
    return addDate;
  }

  static async checkServiceProvider(servicesOrdered, deliveryDate) {
    const getServiceId = await ServiceSubCategoryModel.findOne({
      _id: servicesOrdered.serviceSubCategoryId
    })
      .populate("serviceCategoryId")

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

  static async getCurrentDate() {
    const utc = new Date().toJSON().slice(0, 10).replace(/-/g, "/");
    const currentUnixtime = new Date(utc).getTime() / 1000;
    return currentUnixtime;
  }
}

module.exports = Order;

// --- OLD CODE before 25-----------

// const OrderModel = require("./order.model");
// const UserModel = require("../user/user.model");
// const MembershipModel = require("../memberships/membership.model");
// // const CouponModel = require("../coupon/coupon.model");
// const ServiceSubCategoryModel = require("../serviceSubCategory/serviceSubCategory.model");
// const ServiceProviderModel = require("../serviceProvider/serviceProvider.model");
// const ServiceCategoryModel = require("../serviceCategory/serviceCategory.model");

// class Order {
//   static async addOrder(req, res, next) {
//     console.log("payload-------------11--------------->", req.payload);
//     let orderData = {};
//     const {
//       userId,
//       couponsApplied,
//       servicesOrdered,
//       note,
//       couponValue,
//     } = req.body;

//     const userDetails = await UserModel.findOne({ _id: userId }).lean();
//     let serviceCity = userDetails.address.city;
//     // const membershipDiscount = await MembershipModel.findOne({
//     //   _id: userDetails.membershipType.membershipId,
//     // }).select("MembershipDiscount -_id");

//     orderData.userId = userId;
//     orderData.userName = userDetails.firstName + userDetails.lastName;
//     orderData.userEmail = userDetails.email;
//     orderData.userContactNo = userDetails.contactNumber;
//     // orderData.membershipDiscount = membershipDiscount["MembershipDiscount"];
//     orderData.note = note;
//     orderData.couponValue = couponValue;
//     orderData.orderStatus = "Pending";

//     // const couponValue = await CouponModel.findOne({
//     //   _id: couponsApplied,
//     // }).select("couponValue -_id");
//     // orderData.couponValue = couponValue["couponValue"];

//     orderData.servicesOrdered = [];

//     let services = servicesOrdered;

//     // let serviceDetails = {};

//     for (let i = 0; i < services.length; i++) {
//       let orderedService = {};
//       orderedService.serviceDetails = {};
//       orderedService.serviceProviderDetails = {};
//       // let service = []
//       let subServiceDetails = await ServiceSubCategoryModel.findOne({
//         _id: services[i].serviceSubCategoryId,
//       }).select("-_id -priceType");

//       orderedService.serviceSubCategoryId = services[i].serviceSubCategoryId;

//       orderedService.serviceDetails["serviceSubCategoryName"] =
//         subServiceDetails.serviceSubCategoryName;

//       orderedService.serviceDetails["serviceCategoryId"] =
//         subServiceDetails.serviceCategoryId;

//       orderedService.serviceDetails["price"] =
//         subServiceDetails.price[0].prices;

//       orderedService.quantity = services[i].quantity;

//       orderedService.note = services[i].note;

//       orderedService.deliveryDate = services[i].deliveryDate;

//       orderedService.deliveryTime = services[i].deliveryTime;

//       let serviceId = await ServiceCategoryModel.findOne({
//         _id: subServiceDetails.serviceCategoryId,
//       }).select("parentServiceId");

//       orderedService.serviceDetails["serviceId"] = serviceId.parentServiceId;

//       // Service Provider ---------------------------------------------------->

//       let providerDetails = await ServiceProviderModel.findOne({
//         "address.city": serviceCity,
//         services: orderedService.serviceDetails.serviceId,
//       }).select("serviceProviderName contactNumber");

//       // orderedService.serviceProviderDetails["providerName"] =
//       //   providerDetails.serviceProviderName;

//       orderedService.serviceProviderDetails["contactNumber"] =
//         providerDetails.contactNumber;

//       orderedService.serviceDetails["serviceProviderName"] =
//         providerDetails.serviceProviderName;

//       orderData.servicesOrdered.push(orderedService);
//     }

//     let previousOrder = await OrderModel.findOne()
//       .sort({ createdAt: -1, _id: -1 })
//       .lean();
//     let nextOrder = 1;

//     if (previousOrder) {
//       nextOrder = previousOrder.orderNo + 1;
//       if (nextOrder > 999) {
//         nextOrder = 1;
//       }
//     }

//     orderData.orderNo = nextOrder;

//     let savedOrder = await OrderModel.insertMany(orderData);
//     console.log(
//       "Output---------------------------> ~ file: order.js ~ line 85 ~ Order ~ addOrder ~ savedOrder",
//       savedOrder
//     );

//     // let orderResponse = savedOrder[0]
//     // console.log("Output---------------------------> ~ file: order.js ~ line 87 ~ Order ~ addOrder ~ orderResponse", orderResponse.servicesOrdered)

//     // delete orderResponse.servicesOrdered["serviceDetails"]

//     // console.log("Output---------------------------> ~ file: order.js ~ line 91 ~ Order ~ addOrder ~ orderResponse", orderResponse.servicesOrdered)

//     res.sendResponse(savedOrder);
//   }

//   // static async calculation(req, res, next) {
//   //   console.log("calculation----------------100------------>");
//   //   let totalPrice = 0;
//   //   for (let i = 0; i < cartitems.length; i++) {
//   //     let a = cartitems[i].quantity * cartitems[i].price[0].prices;

//   //     let b = membershipDiscount;

//   //     let c = couponValue;

//   //     totalPrice = totalPrice + a - b - c;
//   //     console.log(
//   //       "Output---------------------------> ~ file: order.js ~ line 109 ~ Order ~ calculation ~ totalPrice",
//   //       totalPrice
//   //     );
//   //   }
//   //   res.sendResponse({});
//   // }

//   // static async getOrder(req, res, next) {
//   //   const allOrders = await OrderModel.find();

//   //   res.sendResponse(allOrders);
//   // }
// }

// module.exports = Order;
