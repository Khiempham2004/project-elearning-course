const Model = require("../models/configurationManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
module.exports = createCrudController(Model, [
  "configKey",
  "configName",
  "configValue",
  "category",
]);
