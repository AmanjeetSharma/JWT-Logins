export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('Async error:', err);
    next(err); // Delegate error handling to Express error middleware
  });
};
