
const UPLOAD_LIMIT = 100;

const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const multer = require('multer');
const multerS3 = require('multer-s3');

//const sh = require('child_process')

const winston = require('winston');
const logger = require('./logger')('WEB');

winston.add(winston.transports.File, {
    filename: 'WEB_error.log',
    level: 'error',
    timestamp: true
});
/*
winston.add(winston.transports.Logstash, {
    port: 5050,
    ssl_enable: false,
    host: 'listener.logz.io',
    max_connect_retries: -1,
    meta: {
        token: 'bdOAQvprXpSokYCuQkrmacxzMFGlbNGD'
    },
    node_name: 'WEB',

    level: 'info',
    timestamp: true,
});
*/
const db = require('./db');
const msg = require('./msg');

const AWS = require('aws-sdk');
AWS.config.loadFromPath('./modules/awsConfig.js');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const lambda = new AWS.Lambda();

//const mem_storage = multer.memoryStorage();
const s3_storage = multerS3({
    s3: s3,
    //dirname: '/upload',
    bucket: 'onairxdet',
    key: function (req, file, cb) {
        // use trackID as file name
        const trackID = "TRCK" + shortid.generate()
        cb(null, req.user.id + "/upload/" + trackID + path.parse(file.originalname).ext)
    }
});

const upload = multer({
    storage: s3_storage
    //storage: mem_storage
});

// nodejs >= 8.x
//const { promisify } = require('util');
// nodejs 6.12 (AWS)
const promisify = require('util.promisify')

const get_tubes_p = promisify(db.queryTubes)
const get_kws_p = promisify(db.queryKW)
const get_dets_p = promisify(db.get_dets)

const queryUrlPH_p = promisify(db.queryUrlPH)
const queryUrlPH_idxProcState_p = promisify(db.queryUrlPH_idxProcState)

const queryKW_p = promisify(db.queryKW)
//const get_track_feed_map_p = promisify(db.get_track_feed_map);


function get_tasksProcState_count(req, callback) {
    const userID = req.user.id;
    Promise.all([queryUrlPH_idxProcState_p(userID, "idle", 0), 
                queryUrlPH_idxProcState_p(userID, "dl_queued", 0),
                queryUrlPH_idxProcState_p(userID, "error", 0)])
    .then(function (data) {
        callback(null, { "idle": data[0].Items.length, "dl_queued": data[1].Items.length, "error": data[2].Items.length });
    })
    .catch(function (err) {
        logger.error(err)
        callback(err, null)
    });
}

function get_feeds_tracks_dets(req, callback) {
    const userID = req.user.id;
    Promise.all([/* get_feeds_p(userID), 
                    get_tracks_p(userID),*/ 
                    get_dets_p(userID),

                    queryUrlPH_idxProcState_p(userID, "idle", 0, null), 
                    queryUrlPH_idxProcState_p(userID, "dl_queued", 0, null),
                    queryUrlPH_idxProcState_p(userID, "error", 0, null),
                    queryUrlPH_idxProcState_p(userID, "downloaded", 0, null), 
                    //TODO filter last month?
                    queryUrlPH_idxProcState_p(userID, "processed", 0, null),
                ])
        .then(function (data) {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(startOfDay - 1 * 864e5);
            const sevendaysbefore = new Date(startOfDay - 7 * 864e5);
            const thirtydaysbefore = new Date(startOfDay - 38 * 864e5);
    
            callback(null, {    "Feeds": {"Items" : []} /*data[0]*/, 
                                "Tracks": {"Items" : []} /*data[1]*/, 

                                "Dets": data[0],

                                "Tasks_idle" : data[1],
                                "Tasks_dl_queued" : data[2],
                                "Tasks_error" : data[3],
                                "Tasks_downloaded" : data[4],

                                "Task_processed_counts" : {   
                                            "month": data[5].Items.filter(it => it.Proc_TS > thirtydaysbefore).length, 
                                            "week": data[5].Items.filter(it => it.Proc_TS > sevendaysbefore).length, 
                                            "yesterday": data[5].Items.filter(it => it.Proc_TS < startOfDay && it.Proc_TS > yesterday).length,
                                            "today": data[5].Items.filter(it => it.Proc_TS > startOfDay).length
                                        }
                            });
        })
        .catch(function (err) {
            logger.error(err);
            callback(err, null);
        });
}

function get_tubes_kws(req, callback) {
    const userID = req.user.id;
    Promise.all([   get_tubes_p(userID), 
                    get_kws_p(userID, 0, null)
                ])
        .then(function (data) {
            callback(null, {    "Tubes": data[0], 
                                "KWs": data[1]
                            })
        })
        .catch(function (err) {
            logger.error(err);
            callback(err, null)
        });
}

const Router = function (app, session, passport, urlencodedParser, jsonParser) {
    function common_return_result(res, err, data) {
        //logger.info(data);
        logger.info(err)

        if (err) {
            res.end(JSON.stringify(err))
        }
        else {
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify(data))
        }
    }

    this.app = app
    this.session = session

    this.app.use(bodyParser.json())

    this.app.get('/login',
        function (req, res) {
            res.render('login.jade', { title: 'Xd login' })
        })

    this.app.post('/login',
        passport.authenticate('local', { failureRedirect: '/login' }),
        function (req, res) {
            res.redirect('/')
        })

    this.app.get('/logout',
        function (req, res) {
            req.logout()
            res.redirect('/')
        })

    this.app.get('/',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('dashboard.jade', { page: req.url, title: 'Xd dashboard' });
        }
    )

    this.app.post('/get_tasksProcState_count',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("get_tasksProcState_count")
            logger.info(req.user)
            logger.info(req.session)

            get_tasksProcState_count(req, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    );

    this.app.post('/get_feeds_tracks_dets',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("get_feeds_tracks_dets")
            logger.info(req.user)
            logger.info(req.session)

            get_feeds_tracks_dets(req, function (err, data) {
                common_return_result(res, err, data)
            });
        }
    )

    this.app.post('/get_tubes_kws',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("get_tubes_kws");
            logger.info(req.user)
            logger.info(req.session)

            get_tubes_kws(req, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.get('/library',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('library.jade', { page: req.url, title: 'Xd tracks' })
        }
    )

    this.app.post('/remove_track',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("remove_track")

            db.removeTrack(req.user.id, req.body.trackID, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.post('/upload',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info('upload start')

            upload.array("uploads[]", UPLOAD_LIMIT)(req, res, function (err) {
                if (err) {
                    logger.error("upload.array failed: ", JSON.stringify(err))
                    res.end(JSON.stringify(err))
                }
                else {
                    function upload_one(title, file) {
                        return new Promise((resolve, reject) => {
                            logger.info("fields", req.body)
                            logger.info("title", title)
                            logger.info("req.body.tags", req.body.tags)
                            logger.info("file ", file)

                            const originalname = file.originalname
                            let filename = file.key.replace(/^.*[\\\/]/, '')
                            logger.info('upload OK: ' + filename)

                            const regex_id = /(TRCK(?:[a-zA-Z0-9\-\=\_]+))/
                            const result_id = filename.match(regex_id)
                            if (result_id) {
                                logger.info('upload REGEX PARSED ID: ' + result_id[1])

                                const params = {
                                    FunctionName: 'ear_fp_make',
                                    // take from s3
                                    Payload: '{"0" : "' + filename + '", "1" : "' + req.user.id + '"}'
                                }
                                lambda.invoke(params, function (err, data) {
                                    if (err) {
                                        //res.end(JSON.stringify(err))
                                        logger.error(err)
                                        reject(err)
                                    }
                                    else {
                                        logger.info(data)
                                        db.addTrack(req.user.id,
                                            result_id[1],
                                            title,
                                            req.body.tags,
                                            originalname,
                                            filename,
                                            function (err, data) {
                                                if (err) reject(err)
                                                else resolve(data)
                                            })
                                    }
                                })
                            }
                            else {
                                logger.error('upload REGEX PARSE ID ERROR!!!')
                                reject('upload REGEX PARSE ID ERROR!!!')
                            }
                        })
                    }

                    // upload can be prtially succ
                    title_arr = req.body.title.split(', ')
                    let upl_data = { Items: [], Errs: [] }
                    Promise.all(req.files.map((file, idx) => {
                        return upload_one(title_arr[idx], file)
                            .then((data) => {
                                logger.info(data)
                                upl_data.Items.push(data)
                            })
                            .catch((err) => {
                                logger.info(err)
                                upl_data.Errs.push(err)
                            })
                    }))
                    .then(() => {
                            if (upl_data.Items.length) {
                                if (upl_data.Errs.length) logger.info('upload partial succ: ' + JSON.stringify(upl_data.Errs))

                                res.writeHead(200, { "Content-Type": "application/json" })
                                res.end(JSON.stringify(upl_data))
                            }
                            else {
                                logger.error('upload partial succ: ' + JSON.stringify(upl_data.Errs))
                                res.end(JSON.stringify(upl_data.Errs))
                            }
                    })
                }
            })
        }
    )

    this.app.get('/feeds',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('feeds.jade', { page: req.url, title: 'Xd feeds' })
        }
    )

    // TODO review - no logic here it's just fasade
    this.app.post('/get_feeds_op_state',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("get_feeds_op_state");

            db.getFeeds(req.user.id, function (err, data) {
                logger.info(data)
                logger.info(err)

                if (err) {
                    res.end(JSON.stringify(err))
                }
                else {
                    res.writeHead(200, { "Content-Type": "application/json" })

                    let transform_data = {}
                    data.Items.map((item) => { transform_data[item.FeedID] = item.OperationalState; })
                    //const transform_data = data.Items.map( (item) => { return { "FeedID": item.FeedID, "OperationalState": item.OperationalState } });

                    res.end(JSON.stringify(transform_data))
                }
            })
        }
    )

    this.app.post('/add_feed',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("add_feed")

            db.addFeed(req.user.id, req.body, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.post('/update_feed',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("update_feed")

            db.updateFeed(req.user.id, req.body, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.post('/remove_feed',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("remove_feed")

            db.removeFeed(req.user.id, req.body.feedID, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.post('/get_jobs',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("get_jobs")
            logger.info(req.user)

            db.get_jobs(req.user.id, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.get('/reports',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('jobs.jade', { page: req.url, title: 'EAR jobs' })
        }
    )

    this.app.post('/get_dets',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("get_dets")
            logger.info(req.user)

            db.get_dets(req.user.id, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.post('/accept_det',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("accept_det")

            db.accept_det(req.user.id, req.body, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    );

    this.app.post('/reject_det',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("reject_det")

            db.reject_det(req.user.id, req.body, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.post('/remove_det',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            logger.info("remove_det")

            db.remove_det(req.user.id, req.body, function (err, data) {
                common_return_result(res, err, data)
            })
        }
    )

    this.app.get('/dets',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('dets.jade', { page: req.url, title: 'Xd dets' })
        }
    )

    this.app.get('/profile',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('profile.jade', { page: req.url, title: 'Xd profile' })
        }
    )

    this.app.get('/tutorial',
        require('connect-ensure-login').ensureLoggedIn(),
        function (req, res) {
            res.render('tutorial.jade', { page: req.url, title: 'Xd help' })
        }
    )

    return this
}

exports.Router = Router

