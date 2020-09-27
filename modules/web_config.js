
const AWS = require('aws-sdk');
AWS.config.loadFromPath('./modules/awsConfig.js');

/*
AWS.config.update({
    accessKeyId: "local", 
    secretAccessKey: "local",
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});
*/

const path = require('path');

const options = {
    table: 'ear_Sessions',
    AWSConfigPath: './modules/awsConfig.js',
    reapInterval: 600000
};

let DynamoDBStore = null;

let AppConfig = function (app, session, express) {
    DynamoDBStore = require('connect-dynamodb')(
        {
            session: session
        }
    );

    this.app = app;
    this.session = session;

    app.set('views', './views');
};

AppConfig.prototype.initSession = function () {
    this.app.use(this.session(
        {
            name: 'ssid',
            store: new DynamoDBStore(options),
            secret: 'Imagination is more important than knowledge.',
            cookie: {
                path: '/',
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 332
            },
            resave: false,
            saveUninitialized: false,
            unset: 'destroy'
        }));
};

exports.AppConfig = AppConfig;
