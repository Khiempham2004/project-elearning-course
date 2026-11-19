const Model = require("../models/systemLogManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
module.exports = createCrudController(Model, [
  "logCode",
  "userName",
  "action",
  "module",
  "description",
  "ipAddress",
  "status",
]);
