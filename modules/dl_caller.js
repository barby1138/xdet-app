
const {USER_ID, DL_CALLER_Q_MAX_THSHLD, DL_CALLER_Q_MIN_THSHLD, CALLDLQ_TO_MSEC}  = require('./worker_config')

const DL_Q_NAME_TMPL = "xdet_Q_dl_"

const winston = require('winston')
const logger = require('./logger')('XDET-DL-CALLER')

winston.add(winston.transports.File, {
    filename: 'DL-CALLER_error.log',
    level: 'error',
    timestamp: true
})
/*
winston.add(winston.transports.Logstash, {
    port: 5050,
    ssl_enable: false,
    host: 'listener.logz.io',
    max_connect_retries: -1,
    meta: {
        token: 'ieRVTDjKyQYjKhOgnovyvkoNjiKCGQkG'
    },
    node_name: 'DL-CALLER',

    level: 'info',
    timestamp: true,
})
*/
const msg = require('./msg')
const db = require('./db')
const { tick } = require('./util')

const { promisify } = require('util')
const updateUrlPH_procState_p = promisify(db.updateUrlPH_procState)
const queryUrlPH_idxProcState_p = promisify(db.queryUrlPH_idxProcState)

const queryTubes_p = promisify(db.queryTubes)

var tubes_arr = []

function total_msg_num_Q() {
    return Promise.all(tubes_arr.map(it => {
        return new Promise( (resolve, reject) => {
            //console.log(it)
            msg.get_msg_Q_massages_num(it, (err, num) => 
            { 
                //console.log(num) 
                if (err)
                {
                    logger.error('get_msg_Q_massages_num ERROR ' + err)
                    num = 0
                }

                resolve(num)
            })
        })
    }))
}

queryTubes_p(USER_ID)    
.then((data) => { 
    logger.info(data)

    tubes_arr = data.Items.map(it => it.DL_Q_name)

    call_dl_q()
    tick(CALLDLQ_TO_MSEC, call_dl_q, null)
})
.catch((err) => { logger.error('queryTubes_p ERROR ' + err) } )

/*
// put one job - for test
queryUrlPH_idxProcState_p(USER_ID, "idle", 1, null)
.then((data) => { 
    logger.info('queryUrlPH_idxProcState_p OK ' + data.Count + ' ' + JSON.stringify(data.LastEvaluatedKey))
    // TODO filter by KW priority
    console.log(data.Items.length)
    
    data.Items.map(it => {
        const id = it.PHID
        const url = it.Path
        const tube = it.Tube
        logger.info(id)
        logger.info(url)
        logger.info(tube)
        
        updateUrlPH_procState_p(USER_ID, id, "dl_queued", null)
        .then((res) => { 
            logger.info('updateUrlPH_procState_p dl_queued OK') 

            send_msg_to_dl(id, url, tube)
            .then((res) => { logger.info('send_msg_to_dl OK') })
            .catch((err) => { logger.info('send_msg_to_dl ERROR ' + err) } )
        } )
        .catch((err) => { logger.info('updateUrlPH_procState_p dl_queued ERROR ' + err) } )
    })
})
.catch((err) => { logger.error('queryUrlPH_idxProcState_p ERROR ' + err) } )
*/
function call_dl_q() {

    return new Promise( (resolve, reject) => {
        //msg.get_msg_Q_massages_num(DL_Q_NAME_MARKER, (err, num) =>
        total_msg_num_Q()
        .then(num_arr => { 
            let num = 0
            num_arr.map(it => num += parseInt(it))
            logger.info(num_arr + " Total: " + num) 

            //console.log(num + ' < ' + DL_CALLER_Q_MIN_THSHLD)
            if (num < DL_CALLER_Q_MIN_THSHLD) {
                const msg_quota = ( DL_CALLER_Q_MAX_THSHLD + DL_CALLER_Q_MIN_THSHLD ) / 2 + 1
                console.log("quota " + msg_quota) 

                queryUrlPH_idxProcState_p(USER_ID, "idle", msg_quota, null)
                .then((data) => { 
                    logger.info('queryUrlPH_idxProcState_p OK ' + data.Count + ' ' + JSON.stringify(data.LastEvaluatedKey))
                    // TODO filter by KW priority

                    data.Items.map(it => {
                        const id = it.PHID
                        const url = it.Path
                        const tube = it.Tube
                        logger.info(id)
                        logger.info(url)
                        logger.info(tube)
                        
                        updateUrlPH_procState_p(USER_ID, id, "dl_queued", null)
                        .then((res) => { 
                            logger.info('updateUrlPH_procState_p dl_queued OK') 

                            send_msg_to_dl(id, url, tube)
                            .then((res) => { logger.info('send_msg_to_dl OK') })
                            .catch((err) => { logger.info('send_msg_to_dl ERROR ' + err) } )
                        } )
                        .catch((err) => { logger.info('updateUrlPH_procState_p dl_queued ERROR ' + err) } )
                    })
                })
                .catch((err) => { logger.error('queryUrlPH_idxProcState_p ERROR ' + err) } )
            }
        })
        // no need to wait
        resolve("next")
    })
}

function watch_dog() {
    return new Promise((resolve, reject) => {
        resolve("watchdog")
    })
    // check hanged urls ts < n days and status not processed
}

function send_msg_to_dl(id, url, tube) {
    return new Promise((resolve, reject) => {
        var msg_attr = {
            "MsgID": {
                DataType: "String",
                StringValue: "dl_job"
            },
            "Url": {
                DataType: "String",
                StringValue: url
            },
            "Id": {
                DataType: "String",
                StringValue: id
            }
        };
        msg.send_msg_Q(DL_Q_NAME_TMPL + tube, msg_attr, function (err, msg_data) {
            if (err) {
                logger.error('send_msg_to_dl send failed: ' + JSON.stringify(err));
                reject(err);
            }
            else {
                logger.debug('send_msg_to_dl send OK: ' + JSON.stringify(msg_data));
                resolve(msg_data);
            }
        });
    });
}

/////////////////////////////////////
// utils
// TODO move to separate file

//const id = '0000'
//const id = 'ph55845292bc003'
//'ph5599650564392'
/*
db.addUrlPH(USER_ID, {
    "PHID":id,
    "title":"bla",
    "kws":"bla",
    "duration":"bla",
    "url":"bla"
}, function (err, res) { console.log(err) } )
*/

//state_to_idle("downloaded")
//state_to_idle("error")
//state_to_idle("dl_queued")
function state_to_idle(state) {
    queryUrlPH_idxProcState_p(USER_ID, state, 0, null)
    .then((data) => { 
        logger.info('queryUrlPH_idxProcState_p OK ' + data.Count + ' ' + JSON.stringify(data.LastEvaluatedKey))
        // TODO put to Q
        // TODO filter by KW priority

        //TODO iter by items
        data.Items.map(it => {
            const id = it.PHID
            logger.info(id)
        
            updateUrlPH_procState_p(USER_ID, id, "idle", null)
            .then((res) => { logger.info('updateUrlPH_procState_p idle OK') } )
            .catch((err) => { logger.info('updateUrlPH_procState_p idle ERROR ' + err) } )
        })
    })
    .catch((err) => { logger.error('queryUrlPH_idxProcState_p ERROR ' + err) } )
}


//ACHTUNG!!! very dangeous
/*********** 
function downloaded_to_processed() {
    queryUrlPH_idxProcState_p(USER_ID, "downloaded", 0, null)
    .then((data) => { 
        logger.info('queryUrlPH_idxProcState_p OK ' + data.Count + ' ' + JSON.stringify(data.LastEvaluatedKey))
        // TODO put to Q
        // TODO filter by KW priority

        //TODO iter by items
        data.Items.map(it => {
            const id = it.PHID
            logger.info(id)
        
            updateUrlPH_procState_p(USER_ID, id, "processed", null)
            .then((res) => { logger.info('updateUrlPH_procState_p processed OK') } )
            .catch((err) => { logger.info('updateUrlPH_procState_p processed ERROR ' + err) } )
        })
    })
    .catch((err) => { logger.error('queryUrlPH_idxProcState_p ERROR ' + err) } )
}
***************/

//filtered_state_to_idle("idle")
function filtered_state_to_idle(state) {
    queryUrlPH_idxProcState_p(USER_ID, state, 0, null)
    .then((data) => { 
        logger.info('queryUrlPH_idxProcState_p OK ' + data.Count + ' ' + JSON.stringify(data.LastEvaluatedKey))
        // TODO put to Q
        // TODO filter by KW priority

        //TODO iter by items
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const threedaysbefore = new Date(startOfDay - 3 * 864e5);

        console.log(threedaysbefore)
        console.log(data.Items
            .filter(it => it.Tube == "xhamster")
            .filter(it => it.Proc_TS > threedaysbefore).length)
            /*
            .map(it => {
            const id = it.PHID
            logger.info(id)
            logger.info(it.Tube)
            logger.info(it.Proc_TS + ' > ' + threedaysbefore)
            
            updateUrlPH_procState_p(USER_ID, id, "idle", null)
            .then((res) => { logger.info('updateUrlPH_procState_p idle OK') } )
            .catch((err) => { logger.info('updateUrlPH_procState_p idle ERROR ' + err) } )
            
            })
            */
    })
    .catch((err) => { logger.error('queryUrlPH_idxProcState_p ERROR ' + err) } )
}
