const standardizeResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return originalJson(body);
    const result = body.result && typeof body.result === 'object' ? body.result : null;
    return originalJson({
      ...body,
      success: body.success ?? (res.statusCode < 400),
      data: body.data ?? result?.data,
      pagination: body.pagination ?? result?.pagination,
    });
  };
  next();
};

module.exports = { standardizeResponse };
