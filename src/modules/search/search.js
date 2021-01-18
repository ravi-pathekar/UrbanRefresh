const ServiceModel = require("./../services/service.model");

class Search {
  static async searchService(req, res) {
  
    try {
      const { search } = req.query;

      // Exact Match.....
      // const serviceList = await ServiceModel.find({
      //   $text: { $search: searchKeyword}
      // });

      // console.log("service RESULTSSSSS:::", serviceList);

      if (search === undefined || search === "") {
        throw new Exception("ValidationError");
      }
      if (search.length > 2) {
        const serviceList = await ServiceModel.find({
          serviceName: {
            $regex: new RegExp(search),
            $options: "i"
          }
        });

        res.sendResponse({ serviceList });
      }
    } catch (err) {
      res.status(400).send(err);
    }
  }
}

module.exports = Search;
