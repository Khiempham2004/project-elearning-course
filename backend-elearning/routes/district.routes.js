const express = require('express');
const controller = require('../controllers/district.controller.js');
const routerDistrict = express.Router();

routerDistrict.get('/', controller.getAll);
routerDistrict.get('/:id', controller.getById);
routerDistrict.post('/', controller.create);
routerDistrict.put('/:id', controller.update);
routerDistrict.delete('/:id', controller.remove);

module.exports = { routerDistrict };
