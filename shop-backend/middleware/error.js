module.exports.errorHandler = (err, req, res, next) => {
  try {
    if (req.log) {
      req.log.error({
        msg: 'Unhandled error',
        err: {
          message: err.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
          name: err.name
        },
        url: req.originalUrl,
        method: req.method
      });
    } else {
      // fallback
      console.error(err);
    }
  } catch (_) {}
  if (res.headersSent) return next(err);
  return res.status(500).json({ status: 'error', error: err.message || 'خطای سرور' });
};






