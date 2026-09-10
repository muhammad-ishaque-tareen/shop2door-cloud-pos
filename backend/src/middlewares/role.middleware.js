/**
 * Role-based authorization middleware.
 * Expects auth.middleware.js to have already run and populated req.user.
 *
 * @param  {...string} roles Allowed roles (e.g. 'system_admin', 'shop_admin', 'store_manager', 'cashier')
 * @returns {Function} Express middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Forbidden: No authenticated user role found",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access denied for role '${req.user.role}'. Required role(s): ${roles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
module.exports.authorizeRoles = authorizeRoles;
