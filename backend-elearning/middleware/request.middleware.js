const mongoose = require('mongoose');

const validateObjectId = (param = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
    return res.status(400).json({ success: false, message: `Mã ${param} không hợp lệ` });
  }
  next();
};

const validateRequired = (...fields) => (req, res, next) => {
  const missing = fields.filter((field) => req.body?.[field] === undefined || req.body[field] === null || req.body[field] === '');
  if (missing.length) return res.status(400).json({ success: false, message: `Thiếu trường bắt buộc: ${missing.join(', ')}` });
  next();
};

module.exports = { validateObjectId, validateRequired };
