
const {USER_ID, DL_MAX_RETRIES, DL_MAX_CNT, DL_Q_MIN_THSHLD, COMMON_POLL_TO_MSEC, ARCH_PATH, DET_Q_NAME}  = require('./worker_config')

const stream = require('stream')
const path = require('path')

const winston = require('winston')
const logger = require('./logger')('XDET-DL-SRC')
winston.add(winston.transports.File, {
    filename: 'DL-SRC_error.log',
    level: 'error',
    timestamp: true
})

winston.add(winston.transports.Logstash, {
    port: 5050,
    ssl_enable: false,
    host: 'listener.logz.io',
    max_connect_retries: -1,
    meta: {
        token: 'ieRVTDjKyQYjKhOgnovyvkoNjiKCGQkG'
    },
    node_name: 'DL-SRC',

    level: 'info',
    timestamp: true,
})

const msg = require('./msg');
const db = require('./db')
const storage = require('./storage')
const { tick, poll_q } = require('./util')

const youtubedl = require('youtube-dl')

const { promisify } = require('util');
const updateUrlPH_procState_p = promisify(db.updateUrlPH_procState);
const updateUrlPH_incDLRetryCount_p = promisify(db.updateUrlPH_incDLRetryCount);

const queryTubes_p = promisify(db.queryTubes)

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

Array.prototype.next = function() {
    if (this.current == this.length - 1)
        this.current = 0
    else
        ++this.current

    return this[this.current];
};
Array.prototype.current = 0;

logger.info("run u-dl")
logger.info("DL_MAX_CNT " + DL_MAX_CNT)

var tubes_arr = []

function dl_q_carusel() {
    tube = tubes_arr.next()
    //console.log("car " + tube)
    return tube
}

let dl_streams_counter = 0
function poll_q_sem() {
    return new Promise( (resolve) => {
        msg.get_msg_Q_massages_num(DET_Q_NAME, (err, num) => 
        { 
            //TODO err?
            if (num < DL_Q_MIN_THSHLD) {
                if (dl_streams_counter < DL_MAX_CNT) {
                    // no need to wait for promise resolve
                    poll_q([dl_q_carusel(), handle_msg_dl])
                    resolve("Polling more...")
                }
                else {
                    logger.info("TOO BUSY - wait " + dl_streams_counter)
                    resolve("TOO BUSY")
                }
            }    
            else {
                logger.warn("Too many waiting for DET " + num + ' >= ' + DL_Q_MIN_THSHLD)
                resolve("Too many waiting for DET")
            }
        })
    })
}

queryTubes_p(USER_ID)    
.then((data) => { 
    logger.info(data)

    tubes_arr = data.Items.map(it => it.DL_Q_name)
    
    tick(COMMON_POLL_TO_MSEC, poll_q_sem, null)
})
.catch((err) => { logger.error('queryTubes_p ERROR ' + err) } )

function handle_msg_dl(msg) {
    return new Promise((resolve, reject) => {
        if ("dl_job" == msg.MessageAttributes.MsgID.StringValue) {
            download_one(msg)
            .then(msg => {
                resolve(msg);
            })
            .catch(err => { 
                //console.error("ERROR download: " + err) 
                reject("ERROR download" + err)
            })
        }
        else {
            reject("invalid msg")
        }
    })
}

function decide_format(url, id) {
    return new Promise((resolve, reject) => {
        youtubedl.getInfo(url, (err, info) => {
            try {
                if (err) throw ("decide_format: " + err)
                else {
                    //console.log(info)
                    if (info.formats != undefined) {
                        // map is sync
                        var dl_fmt = null
                        info.formats.map((fmt) => {
                            /*
                            console.log("Fmt")
                            console.log(fmt.ext)
                            console.log(fmt.format_id)
                            console.log(fmt.height)
                            */
                            if (dl_fmt == null) dl_fmt = fmt
                            else if (dl_fmt.height > fmt.height) dl_fmt = fmt 
                        })
                        if (dl_fmt != null) resolve(dl_fmt)
                        else throw ("decide_format: empty formats")
                    }
                    else
                        throw ("decide_format: no formats")
                }
            }
            catch (err) {
                logger.warn(err)
                // anyway start download with default fmt
                resolve(null)
            }
        })
    })
}

const fs = require('fs')
/*
test_download_one('https://xhamster.com/videos/hardcore-3er-mit-blondem-engel-8735708', 'engel-8735708')
function test_download_one(url, id) {
    return new Promise((resolve, reject) => {
        try {
*/
function download_one(msg) {
    return new Promise((resolve, reject) => {
        try {
            let id = msg.MessageAttributes.Id.StringValue
            const url = msg.MessageAttributes.Url.StringValue

            logger.info('handle_msg: url: ' + url + ' id: ' + id)

            // TODO check state of Url if error - skip - remove msg
            // deside format
            // TODO update DB with size etc.
            decide_format(url, id)
            .then((dl_fmt) => {
                logger.debug(dl_fmt)
                args = []
                if (dl_fmt != null && dl_fmt.format_id.length != 0) {
                    logger.info("format_id: " + dl_fmt.format_id)
                    args.push("--format=" + dl_fmt.format_id)
                }
                else
                    logger.warn("format_id: DEFAULT")

                const file_name_str = id + '.mp4'
                logger.info("new video " + file_name_str)

                function proc_fail(resolve_fn, reject_fn, err) {
                    logger.info("proc_fail")
                    updateUrlPH_incDLRetryCount_p(USER_ID, id)
                    .then((res) => { 
                        //TODO to error state if count > treshold
                        logger.info('updateUrlPH_incDLRetryCount_p OK: ' + res) 

                        if (res > DL_MAX_RETRIES) {
                            logger.error("Can not download > " + DL_MAX_RETRIES + " retries - err: " + err) 
                            // set to ERROR and remove from msg q
                            updateUrlPH_procState_p(USER_ID, id, "error", null)
                            .then((res) => { logger.info('updateUrlPH_procState_p error OK') } )
                            .catch((err) => { logger.error('updateUrlPH_procState_p error ERROR ' + err) } )
                            // return resolve to del msg from q
                            resolve_fn(err)
                        }
                        else {
                            reject_fn(err)
                        }

                    } )
                    .catch((err) => { 
                        logger.info('updateUrlPH_incDLRetryCount_p ERROR ' + err) 
                        reject_fn(err)
                    } )
                }

                // local
                /*
                const writeStream = fs.createWriteStream(ARCH_PATH + '/' + file_name_str);
                writeStream.on('error', function (err) {
                    logger.error('writeStream ERROR: ' + err) 
                });
                writeStream.on('close', function (err) {
                    logger.info("writeStream on.close");                  
                });
                writeStream.on('finish', function (err) {
                    logger.info("writeStream on.finish") 
                });
                */

                const video = youtubedl(url, args)
                 
                let size = 0
                // Will be called when the download starts.
                video.on('info', function(info) {
                    logger.info('Download started ...')
                    logger.info('size: ' + info.size)
                    if (undefined != info.size)
                        size = info.size
                    logger.info('format id:', info.format_id)

                    dl_streams_counter++
                    logger.info('dl_streams_counter inc')
                    logger.info('started dl_streams_counter ' + dl_streams_counter) 

                    video.pipe(fs.createWriteStream(ARCH_PATH + '/' + file_name_str))
                })

                video.on('end', function() {
                    dl_streams_counter--
                    logger.info('dl_streams_counter dec') 
                    logger.info('finish OK dl_streams_counter ' + dl_streams_counter ) 
                    
                    logger.info('video (DL) on.end id: ' + id) 

                    resolve("DL OK") 
                    updateUrlPH_procState_p(USER_ID, id, "downloaded", {"size" : size} )
                    .then((res) => { logger.info('updateUrlPH_procState_p downloaded OK') } )
                    .catch((err) => { logger.error('updateUrlPH_procState_p downloaded ERROR ' + err) } )

                    const bucket = "local"
                    const key = file_name_str
                    send_msg_to_det(bucket, key)
                    .then((res) => { logger.info('send to det OK') } )
                    .catch((err) => { logger.error('send to det ERROR ' + err) } ) 
                })

                video.on('error', function (err) {
                    //dl_streams_counter--
                    //logger.info('finish ERROR dl_streams_counter ' + dl_streams_counter ) 
                    proc_fail (resolve, reject, "DL ERROR: " + err) 
                })
                
                /*
                // s3
                const bucket = S3_BUCKET
                const pass = new stream.PassThrough();
                storage.upload_file(pass, bucket, key)
                .then((res) => { 
                    console.log(res)
                    console.log(size)
                    resolve("DL OK") 
                    //TODO call lambda?
                    updateUrlPH_procState_p(USER_ID, id, "downloaded", {"size" : size} )
                    .then((res) => { logger.info('updateUrlPH_procState_p OK') } )
                    .catch((err) => { logger.error('updateUrlPH_procState_p ERROR ' + err) } )

                    // s3 trigger
                    //send_msg_to_det(bucket, key)
                    //.then((res) => { logger.info('send to det OK') } )
                    //.catch((err) => { logger.error('send to det ERROR ' + err) } )
                })
                .catch((err) => { 
                    proc_fail (resolve, reject, "DL failed: " + err) 
                })
                */
                // s3
                //video.pipe(pass);
                // local
                /*
                dl_streams_counter++
                logger.info('start dl_streams_counter' , {"snt" : dl_streams_counter} ) 
                video.pipe(writeStream);

                video.on('end', function() { 
                    dl_streams_counter--
                    logger.info('stream finished downloading!') 
                    logger.info('finish OK dl_streams_counter' , {"snt" : dl_streams_counter} ) 
                })

                video.on('error', function(err) 
                { 
                    dl_streams_counter--
                    proc_fail (resolve, reject, "DL ERROR: " + err) 
                    logger.info('finish ERROR dl_streams_counter' , {"snt" : dl_streams_counter} ) 
                })
                */
            })
        }
        catch(err) { 
            logger.error("download_one " + err) 
            reject(err)
        }
    })
}

// moved to trigger for s3
// used ONLY for local
function send_msg_to_det(bucket, key) {
    return new Promise((resolve, reject) => {
        var msg_attr = {
            "MsgID": {
                DataType: "String",
                StringValue: "det_job"
            },
            "Bucket": {
                DataType: "String",
                StringValue: bucket
            },
            "Key": {
                DataType: "String",
                StringValue: key
            }
        }
        msg.send_msg_Q(DET_Q_NAME, msg_attr, function (err, msg_data) {
            if (err) {
                logger.error('send_msg_to_det send failed: ' + JSON.stringify(err))
                reject(err)
            }
            else {
                logger.debug('send_msg_to_det send OK: ' + JSON.stringify(msg_data))
                resolve(msg_data)
            }
        })
    })
}

//const test_id = 'ph5b8c16e705a81'
//const test_url = 'https://www.pornhub.com/view_video.php?viewkey=ph5b8c16e705a81'
