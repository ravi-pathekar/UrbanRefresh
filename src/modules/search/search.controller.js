const express = require("express");
const router = express.Router();
const Search = require("./search");

router.get("/v1/search/service", Search.searchService);


module.exports = router;
