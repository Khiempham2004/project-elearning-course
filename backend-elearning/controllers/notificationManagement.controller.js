const Model = require("../models/notificationManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
module.exports = createCrudController(Model, [
  "title",
  "content",
  "type",
  "recipient",
  "status",
]);
