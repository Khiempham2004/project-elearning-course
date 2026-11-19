const { provinceModel } = require('../models/province.model.js');
const { createLocationController } = require('./location.controller.js');

module.exports = createLocationController({
    model: provinceModel,
    fields: ['provinceCode', 'provinceName', 'provinceType'],
    label: 'tỉnh/thành phố',
});
