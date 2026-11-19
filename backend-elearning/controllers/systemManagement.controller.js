const Model = require("../models/systemManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
module.exports = createCrudController(Model, [
  "functionCode",
  "functionName",
  "functionType",
  "functionUrl",
  "description",
]);
