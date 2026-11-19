const Model = require("../models/multiLevelManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
module.exports = createCrudController(Model, [
  "roomCode",
  "roomName",
  "roomType",
]);
