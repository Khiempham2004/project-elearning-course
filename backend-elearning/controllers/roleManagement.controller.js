const Model = require("../models/roleManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
module.exports = createCrudController(Model, [
  "roleCode",
  "roleName",
  "description",
]);
