// TODO common
// TODO add absolute ts to detection

const {DATA_FOLDER, USER_ID, DET_MAX_INFLY_THSHLD, DET_Q_NAME}  = require('./worker_config')

const DET_PROC_POLL_TO_MSEC = 30 * 1000
//const DET_Q_NAME = "xdet_Q_det"

const glob = require('glob')
const shortid = require('shortid')
const fs = require('fs')
const parser = require('xml2js').Parser()
const chokidar = require('chokidar')
const path_module = require('path')

const winston = require('winston')
const logger = require('./logger')('DET')

winston.add(winston.transports.File, {
    filename: 'DET_error.log',
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
    node_name: 'DET',

    level: 'info',
    timestamp: true,
})

const storage = require('./storage.js')
const db = require('./db')
const { basename, tick, poll_q, mkdir } = require('./util')

const { promisify } = require('util')
const add_detection_p = promisify(db.add_detection)
const parseString_p = promisify(parser.parseString)
const updateUrlPH_procState_p = promisify(db.updateUrlPH_procState);

const infly_UPDATE_TO = 1000 * 60 * 10 // min
const wd_UPDATE_TO = 1000 * 60 * 10 // min

let lastCount = 0
let infly_lastUpdateTS = 0;
function count_infly_jobs() {
    return new Promise((resolve, reject) => {
        options = {}
        //infly msges
        //TODO count files just onece per 30min
        passed = (Date.now() - infly_lastUpdateTS)
        //console.log(lastUpdateTS)
        //console.log(passed)
        if (infly_lastUpdateTS == 0 || passed > infly_UPDATE_TO) {
            //console.log("update")
            glob(DATA_FOLDER + "/infly/*.xml", options, function (err, files) {
                let length = 0
                if (err) 
                    logger.error("count_infly_jobs FAILED: " + err)
                else
                    length = files.length
                    lastCount = length

                infly_lastUpdateTS = Date.now()

                logger.info('infly msges: ' + lastCount)

                resolve(lastCount)
            })
        }
        else {
            //console.log("send last")
            resolve(lastCount)
        }
    })
}

let wd_lastUpdateTS = 0
function wd() {
    return new Promise((resolve, reject) => {
        options = {}
        //infly msges
        //TODO count files just onece per 30min
        passed = (Date.now() - wd_lastUpdateTS)
        //console.log(lastUpdateTS)
        //console.log(passed)
        if (wd_lastUpdateTS == 0 || passed > wd_UPDATE_TO) {
            //console.log("update")
            /*
            is_proc_up(function (err, files) {
                resolve("OK")
            })
            */
            resolve("tmp")
        }
        else {
            //console.log("skip")
            resolve("skip")
        }
    })
}

function eval_accept_status(type, quants) {
    console.log(type)
    console.log(quants)
    
    if (type == "FULL")
        return "auto_accepted"
        
    var acceot_status = "auto_accepted"

    const quants_arr = quants.split("#")

    const quants_arr_length = quants_arr.length

    var nums = []
    var curr_q_num = 0
    var misorder = 0
    for (i = 0; i < quants_arr_length; i++) {
        const quant_arr = quants_arr[i].split(",")
        const quant = quant_arr[0]
        const ts = quant_arr[1]
        const match = quant_arr[2]
        const quant_prop_arr = quant.split("_")
        const quant_prop_total_cnt = quant_prop_arr[0]
        const quant_prop_period_sec = quant_prop_arr[1]
        const quant_prop_q_num = quant_prop_arr[2]
        const quant_prop_q_subnum = quant_prop_arr[3]

        if (curr_q_num > quant_prop_q_num)
            misorder++
        else
            curr_q_num = quant_prop_q_num

        if (nums[quant_prop_q_num] == undefined)
            nums[quant_prop_q_num] = { "counter" : 1, "min_ts" : 0, "max_ts" : 0 }
        else {
            nums[quant_prop_q_num].counter++

            if (ts < nums[quant_prop_q_num].min_ts || nums[quant_prop_q_num].min_ts == 0)
                nums[quant_prop_q_num].min_ts = ts
            
            if (ts > nums[quant_prop_q_num].max_ts || nums[quant_prop_q_num].max_ts == 0)
                nums[quant_prop_q_num].max_ts = ts
        }
    }

    var cnt = Object.keys(nums).length
    var str = "!!!"
    str += Object.keys(nums).length
    str += "#"
    str += misorder
    str += "#"

    for (var ii in nums) {
        str += nums[ii].max_ts - nums[ii].min_ts
        str += "?"
        str += nums[ii].counter
        str += "#"

        if (cnt <= 2 && (nums[ii].max_ts - nums[ii].min_ts > 2000)) {
            str += "timesusp#"
            acceot_status = "await"
        }
    }

    console.log(nums.length)
    console.log(nums)

    return acceot_status
}

async function det_process(data) {
    try {
        const result = await parseString_p(data)

        const detjobID = result.job_report.$.jobID
        if (undefined != result.job_report.DET_REPORTS && undefined != result.job_report.DET_REPORTS[0].det_report) {
            logger.info(result.job_report.DET_REPORTS[0])
            return await Promise.all(result.job_report.DET_REPORTS[0].det_report.map(async (rep_item, rep_idx) => {
                let rep_analyzed_path = "INVALID_ID"
                if (undefined != rep_item.analyze) {
                    logger.info("length_sec: " + rep_item.analyze[0].$.length_sec)
                    rep_analyzed_path = basename(rep_item.analyze[0].$.path)
                }
                if (undefined != rep_item.process) {
                    logger.info("proc_time_sec: " + rep_item.process[0].$.time_sec)
                }

                if (undefined != rep_item.DETECTIONS && undefined != rep_item.DETECTIONS[0].NODET) {
                    if (rep_item.DETECTIONS[0].NODET[0].$.msg == "transcode failed")
                        logger.warn("Got transcode failed from core")
                }

                if (undefined != rep_item.DETECTIONS && undefined != rep_item.DETECTIONS[0].DETECT) {
                    const dets_in_report_cnt = rep_item.DETECTIONS[0].DETECT.length
                    await Promise.all(rep_item.DETECTIONS[0].DETECT.map(async (det_item, det_idx) => {
                        const type = det_item.$.type
                        const marker = det_item.$.marker
                        const b = det_item.$.begin
                        const e = det_item.$.end
                        let warnings = ""
                        let quants = ""                       
                        // detected track
                        let trackID = marker

                        if (undefined != det_item.WARNINGS && undefined != det_item.WARNINGS[0].WARNING) {
                            det_item.WARNINGS[0].WARNING.map((it) => {
                                //logger.info(item.$.type);
                                const warning = it.$.type;
                                warnings += (warnings) ? ("#" + warning) : warning
                            });
                        }

                        if (undefined != det_item.QUANTS && undefined != det_item.QUANTS[0].QUANT) {
                            det_item.QUANTS[0].QUANT.map((it) => {
                                const quant = it.$.q + "," + it.$.msec + "," + it.$.match
                                quants += (quants) ? ("#" + quant) : quant
                            });
                        }

                        // should always be present
                        if (undefined != det_item.ANALYZEDS && undefined != det_item.ANALYZEDS[0].ANALYZED) {

                            // get some params from the first item
                            const start_ts = det_item.ANALYZEDS[0].ANALYZED[0].$.start_ts
                            // throws
                            const analyzed_path = det_item.ANALYZEDS[0].ANALYZED[0].$.path
                            // archiver job
                            const userID = USER_ID
                            const feedID = "dummy"
                   
                            logger.info('det: ' + detjobID + " " + type + " " + marker + " " + feedID + " " + trackID + " " + b + " " + e)
                            logger.info('wrn: ' + warnings)
                            logger.info('qua: ' + quants)
                            logger.info('start_ts: ' + start_ts)

                            const detID = detjobID + '-' + rep_idx + '-' + det_idx;

                            const acceot_status = (dets_in_report_cnt > 1) ? "await" : eval_accept_status(type, quants)

                            //put detection to DB
                            await add_detection_p(
                                userID,
                                // in this case we provide detID - not generate in insertion func
                                detID,
                                'PH', // feed name PH
                                basename(trackID),// marker name
                                basename(analyzed_path), // url id,
                                //analyzed_key,
                                'N/A',
                                //track_data.Items[0].Path,
                                0,
                                (b - start_ts), //begin_shift
                                (e - start_ts), //end_shift
                                type,
                                (warnings) ? warnings : 'none',
                                (quants) ? quants : 'N/A',
                                acceot_status
                            )
                        }
                    }))
                }

                return rep_analyzed_path

            }))
        }
        else {
            // TODO what to do here?
            // should return promise
            // invalid report
            logger.error("This NEVER should happen")
        }
    }
    catch (err) {
        logger.error("det_process ex: " + err)
    }
}

async function sync_FPs(fp_path) {
    // check id dl folde4r empty
    //const download = storage.get_and_untar_files(to_download_arr, s3_fp_path, fp_path);
    const keys = await storage.list_objects(S3_BUCKET, USER_ID + '/fp/')
    await storage.get_and_untar_files(keys, S3_BUCKET, fp_path)
}

// TODO!!!
const CH_NUM_MAX = 40//320
let ch_num = 0
//prepare_ear_cmd(S3_BUCKET, 'upload/' + USER_ID + '/' + 'ph5599650564392.mp4')
//prepare_ear_cmd(S3_BUCKET, 'upload/' + USER_ID + '/' + 'ph5599650564392.mp4')
//prepare_ear_cmd(S3_BUCKET, 'upload/' + USER_ID + '/' + 'ph5599650564392.mp4')
//prepare_ear_cmd(S3_BUCKET, 'upload/' + USER_ID + '/' + 'ph5599650564392.mp4')

function prepare_ear_cmd(bucket, key) {
    return new Promise(async (resolve, reject) => {
        try {          
            const feedID = 'PH'
            //ch_num = (ch_num < CH_NUM_MAX) ? ch_num + 1 : 0

            const arch_path = DATA_FOLDER + '/archive/' + USER_ID + '/' + feedID
            const filename = path_module.basename(key)

            // s3
            //await storage.download_file(key, bucket, arch_path + '/' + filename)
            // local - do nothiong - key == filename
            //logger.info('arch downloaded')

            const fp_path = arch_path + '/fp'
            const new_to_ear_path = arch_path + '/' + filename
            //await 
            // TODO uncomment
            //await sync_FPs(fp_path)
            //logger.info('fp downloaded / untared')

            const detJobID = "DETJOB" + shortid.generate()
            // TODO indicate no buffer
            const cmd_xml_str =
            '<EAR_cmd>' +
            '<job jobID="' + detJobID + '" cmd="audio_match" />' +
            '<adwatch>' +
            '<watch>' +
            // use jobID - arch session ID not feedID
            // to force run detection in parallel
            '<chunk channel_name="' + feedID + '_' + ch_num + '" src_type="file" path="' + new_to_ear_path + '" />' +
            '<markers path="' + fp_path + '\" />' +
            '<config_ex purge_cache="true" force_flush_detections_eof="true" />' +
            '</watch>' +
            '</adwatch>' +
            '</EAR_cmd>'

            ch_num += 1
            ch_num = (ch_num < CH_NUM_MAX) ? ch_num : 0

            logger.info(cmd_xml_str)

            fs.writeFile(DATA_FOLDER + '/tmp/' + detJobID + '.xm_', cmd_xml_str, (err, data) => {
                if (err) {
                    logger.error(err)
                    reject(err)
                }
                else {
                    fs.rename(DATA_FOLDER + '/tmp/' + detJobID + '.xm_', DATA_FOLDER + '/infly/' + detJobID + '.xml', (err) => { if (err) logger.error(err); })
                    resolve("prepared")
                }
            })
        }
        catch (err) {
            logger.error(err)
            reject(err)
        }
    })
}

///////////////////////////////////
// server

logger.info('run det');

function poll_det_q() {
    return new Promise( (resolve) => {
        Promise.all([count_infly_jobs(), wd()])
        .then(res => {
            //console.log(num)
            if (res[0] < DET_MAX_INFLY_THSHLD) {
                // no need to wait
                poll_q([DET_Q_NAME, handle_msg_det])
                resolve("DET Poll more..")
            }
            else {
                logger.warn('DET TOO BUSY: ' + res[0] + ' >= ' + DET_MAX_INFLY_THSHLD)
                resolve("DET TOO BUSY")
            }
        })
        .catch(err => { 
            logger.error('poll_det_q ERROR ' + err) 
            resolve("poll_det_q ERROR")
        })
    })
}

tick(DET_PROC_POLL_TO_MSEC, poll_det_q, null)

function handle_msg_det(msg) {
    return new Promise((resolve, reject) => {
        if ("det_job" == msg.MessageAttributes.MsgID.StringValue) {
            logger.info("handle_msg_det dl job")

            const backet = msg.MessageAttributes.Bucket.StringValue
            const key = msg.MessageAttributes.Key.StringValue

            logger.info(backet)
            logger.info(key)
            if ((/\.(mp4)$/i).test(key)) {
                logger.info('handle_msg_det: ' + key)
                prepare_ear_cmd(backet, key)
                .then((res) => {
                    resolve("handle_msg_det done OK")
                })
                .catch((err) => {
                    resolve("handle_msg_det done WARN: " + err)
                })
            }
            else {
                logger.error('handle_msg_det NOT media: ' + path)
                resolve("handle_msg_det done WARN: unexpected media type")
            }
        }
        else {
            reject("handle_msg_det invalid msg")
        }
    })
}

const watcher = chokidar.watch(DATA_FOLDER + '/processed/*.det.xml', { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true })
watcher
    .on('add', function (path) {
        //logger.info('add ', path);
        if ((/\.(det.xml)$/i).test(path)) {
            logger.info('added ', path)
            fs.readFile(path, (err, data) => {
                if (err) {
                    logger.error("fs.readFile failed " + err)
                } else {
                    det_process(data)
                    .then((ids) => {
                        logger.info("processed OK id: " + ids[0])
                        // TODO check for INVALID_ID?
                        // update Url Status to processed
                        updateUrlPH_procState_p(USER_ID, ids[0], "processed", null)
                        .then((res) => { logger.info('updateUrlPH_procState_p processed OK') } )
                        .catch((err) => { logger.error('updateUrlPH_procState_p processed ERROR ' + ids[0] + " " + err) } )

                        logger.info('det_process - succ: ' + path)
                        // move job and job_res to processed
                        fs.rename(path, 
                                    path.replace("/processed/", "/store/"), 
                                    (err) => { if (err) logger.error(err); });

                        fs.rename(path.replace("/processed/", "/infly/").replace(".det.xml", ".xml"), 
                                    path.replace("/processed/", "/store/").replace(".det.xml", ".xml"), 
                                    (err) => { if (err) logger.error(err); });

                    })
                    .catch((err) => {
                        // Should not happen
                        // how to know id here?
                        // update Url Status to error descr: err
                        /*
                        updateUrlPH_procState_p(USER_ID, id, "error", null)
                        .then((res) => { logger.info('updateUrlPH_procState_p error OK') } )
                        .catch((err) => { logger.error('updateUrlPH_procState_p error ERROR ' + err) } )
                        */
                        logger.error('det_process - failed: ' + path + ' ' + err)
                        // move job and job_res xml to error
                        fs.rename(path, 
                                    path.replace("/processed/", "/error/"), 
                                    (err) => { if (err) logger.error(err); });

                        fs.rename(path.replace("/processed/", "/infly/").replace(".det.xml", ".xml"), 
                                    path.replace("/processed/", "/error/").replace(".det.xml", ".xml"), 
                                    (err) => { if (err) logger.error(err); });
                    })
                }
            });
        }
    });

///////////////////
// TESTS

var str2 =
'<job_report jobID="DETJOBrkRhRFKR7">' +
'<DET_REPORTS>;' +
'<det_report>' +
'<analyze path="/home/tsis/data_arch/archive/u0/FEEDBymC68tGG/2018-11-26/FEEDBymC68tGG_2018-11-26_16-12-08_1543245128.ts" length_sec="300" start_ts="13491250"/>' +
'<DETECTIONS>' +
'<DETECT type="FULL" marker="/home/tsis/data/archive/u0/FEEDBymC68tGG/fp//TRCKByrl_a8-y0X.mp3.wav" begin="13498250" end="13522000">'+
'<ANALYZEDS>'+
'<ANALYZED path="/home/tsis/data_arch/archive/u0/FEEDBymC68tGG/2018-11-26/FEEDBymC68tGG_2018-11-26_16-12-08_1543245128.ts" length_sec="300" start_ts="13491250"/>'+
'</ANALYZEDS>'+
'<WARNINGS>'+
'</WARNINGS>'+
'<QUANTS>'+
'<QUANT q="3_6_0_1" msec="13498250" match="89" />'+
'<QUANT q="3_6_0_2" msec="13498250" match="78" />'+
'<QUANT q="3_6_0_5" msec="13498750" match="87" />'+
'</QUANTS>'+
'</DETECT>'+
'</DETECTIONS>'+
'<process time_sec="16" />'+
'</det_report>'+
'</DET_REPORTS>'+
'</job_report>'

var str3 =
    '<job_report>' +
    '<DET_REPORTS>' +
    '<det_report>' +
    '<analyze path="/home/tis/data/archive/x0/ph00001.mp4" length_sec="90" />' +
    '<DETECTIONS>' +
    '</DETECTIONS>' +
    '<process time_sec="33" />' +
    '</det_report>' +
    '</DET_REPORTS>' +
    '</job_report>'

//det_process(str2);
//det_process(str2);
//det_process(str1);
// s3 trigger
/*
	"eventName":"ObjectCreated:CompleteMultipartUpload",
	"bucket":{"name":"xdet","ownerIdentity":{"principalId":"A1BQDA81WX64RV"},
	"object":{"key":"upload/x0/ph55845292bc003.mp4","size":17365556,"eTag":"a7f94ac4ae3f82ded9c673fb6e72f986-4","sequencer":"005C025515DF46ADBA"}}
*/
/*
tick(COMMON_POLL_TO_MSEC, poll_q, [DET_Q_NAME, handle_msg])
function handle_msg(msg) {
    return new Promise((resolve, reject) => {
        try {
            const body = JSON.parse(msg.Body)
            if ("ObjectCreated:CompleteMultipartUpload" == body.Records[0].eventName) {
                logger.info("handle_msg det job")
                const backet = body.Records[0].s3.bucket.name
                const key = body.Records[0].s3.object.key
                const size = body.Records[0].s3.object.size
                logger.info(backet)
                logger.info(key)
                if ((/\.(mp4)$/i).test(key)) {
                    logger.info('handle_msg: ' + key)
                    prepare_ear_cmd(backet, key)
                    .then((res) => {
                        resolve("handle_msg done OK")
                    })
                    .catch((err) => {
                        resolve("handle_msg done WARN: " + err)
                    })
                }
                else {
                    logger.error('handle_msg NOT media: ' + path)
                    resolve("handle_msg done WARN: unexpected media type")
                }
            }
            else {
                resolve("handle_msg done WARN: unexpected msg")
            }
        }
        catch (err) {
            logger.error(err)
            //resolve(err)
        }
    })
}
*/