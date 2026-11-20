const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.statusCode || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = status === 500 ? 'Đã xảy ra lỗi máy chủ' : (error.message || 'Yêu cầu không hợp lệ');
  if (status === 500) console.error(error);
  return res.status(status).json({ success: false, message });
};

module.exports = { errorHandler };
