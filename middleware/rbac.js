const roleAccess = (allowedRoles) => {
    return (req, res, next) => {
        if (req.isAuthenticated() && req.user.roles.some(role => allowedRoles.includes(role))) {
            next();
        } else {
            res.status(403).send('Access Denied');
        }
    };
};

module.exports = roleAccess;
