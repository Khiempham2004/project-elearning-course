const Model = require('../models/userGroupManagement.model');
const { createCrudController } = require('./directoryCrud.controller');
module.exports = createCrudController(Model, ['groupCode', 'groupName', 'description', 'permissionName']);
