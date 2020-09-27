const express = require('express');

const passport = require('passport');
const Strategy = require('passport-local').Strategy;

const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const Config = require('./modules/web_config');
const Router = require('./modules/router');
const users = require('./users');

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(function (username, password, cb) {
    users.users.findByUsername(username, function (err, user) {
        if (err) { return cb(err); }
        if (!user) { return cb(null, false); }
        if (user.password != password) { return cb(null, false); }
        return cb(null, user);
    });
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    users.users.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

const app = express();

app.set('views', __dirname + '/views');
// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'private')));

const port = process.env.PORT || 3000;
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json();
const config = new Config.AppConfig(app, session, express);
config.initSession();
const router = new Router.Router(app, session, passport, urlencodedParser, jsonParser);

const server = app.listen(port, function () {
    console.log('Listening on port %d', server.address().port);
});
