const express = require('express');
const controller = require('../controllers/province.controller.js');
const routerProvince = express.Router();

routerProvince.get('/', controller.getAll);
routerProvince.get('/:id', controller.getById);
routerProvince.post('/', controller.create);
routerProvince.put('/:id', controller.update);
routerProvince.delete('/:id', controller.remove);

module.exports = { routerProvince };
