const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const isMatch = await user.comparePassword(password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, { id: user.id, roles: user.roles });
    });

    passport.deserializeUser(async (user, done) => {
        try {
            const foundUser = await User.findById(user.id);
            done(null, { id: foundUser.id, username: foundUser.username, roles: foundUser.roles });
        } catch (err) {
            done(err);
        }
    });
};
