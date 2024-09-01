const roleAccess = (allowedRoles) => {
    return (req, res, next) => {
        if (req.isAuthenticated() && req.user.roles.some(role => allowedRoles.includes(role))) {
            next();
        } else {
            res.status(403).send('Access Denied');
        }
    };
};

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

module.exports = { roleAccess, isAuthenticated };
