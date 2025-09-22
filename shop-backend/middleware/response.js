module.exports.apiResponse = (req, res, next) => {
  res.success = (data = {}, status = 200) => {
    return res.status(status).json({ status: 'ok', ...data });
  };
  res.fail = (message = 'خطا', status = 400) => {
    return res.status(status).json({ status: 'error', error: message });
  };
  next();
};






