const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const roleAccess = require('../middleware/rbac');

// Register (admin only)
router.post('/register', roleAccess(['admin']), async (req, res) => {
    try {
        const { username, password, roles } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }
        
        // Ensure roles is an array
        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        // Ensure at least 'user' role is assigned
        if (!userRoles.includes('user')) {
            userRoles.push('user');
        }

        const user = new User({ username, password, roles: userRoles });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(400).send('Error registering user');
    }
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).send(info.message);
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Change Password
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        // Check if the current password is correct
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).send('Current password is incorrect');
        }

        // Update the password
        user.password = newPassword;
        await user.save();

        res.send('Password updated successfully');
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).send('Error changing password');
    }
});

module.exports = router;
