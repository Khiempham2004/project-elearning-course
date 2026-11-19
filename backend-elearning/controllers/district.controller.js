const { districtModel } = require('../models/district.model.js');
const { createLocationController } = require('./location.controller.js');

module.exports = createLocationController({
    model: districtModel,
    fields: ['districtCode', 'districtName', 'districtType', 'provinceName'],
    label: 'quận/huyện',
});
