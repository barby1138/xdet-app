const logger = require('./logger')('UTIL');

const msg = require('./msg');
const sh = require('child_process');
const fs = require('fs');

exports.basename = basename;
function basename(path) {
    let base = path.split(/[\\/]/).pop()
    if(base.lastIndexOf(".") != -1)       
        base = base.substring(0, base.lastIndexOf("."));

    return base
}

// browser_source
exports.delay = delay;
function delay(t, v) {
    return new Promise((resolve) => {
        setTimeout(resolve.bind(null, v), t)
    });
}

exports.tick = tick;
async function tick(t, f, v) {
    try {
    while (true) {
        await delay(t)
        //console.log('tick')
        await f(v)
            .then((res) => {
                console.log("f(v) tick OK")
            })
            .catch( (err) => {
                logger.error('f(v) tick ERROR: ' + err)
            })
        //console.log('tick OUT')
    }
    }
    catch (err) {
        console.log('tick Exc: ' + err)
        logger.error(err)
        //resolve(err)
    }
}

// poll_q and hndl_f return Promisses
exports.poll_q = poll_q;
function poll_q(v) {
    const q_name = v[0];
    const hndl_f = v[1];
    logger.debug('poll_q_1: ' + v[0])
    function process_msg_one(message) {
        return new Promise((resolve) => {
            hndl_f(message)
            .then(res => {
                //msg.
                msg.delete_msg(q_name, message, (err, del_data) => {
                    if (err) logger.error("msg.delete_msg ERROR " + err);
                    resolve("OK")
                });
            })
            .catch(err => { 
                logger.error("ERROR hndl_f: " + err) 
                resolve("hndl_f FAILED")
            } )
        })
    }

    // resolve ONLY
    return new Promise( (resolve) => {
        msg.recv_msg_Q(q_name, (err, data) => {
            if (!err && data.Messages != undefined) {
                return Promise.all( data.Messages.map((message) => {
                    logger.info(q_name + " process: " + message);
                    return process_msg_one(message);
                }) )
            }
            else {
                if (err) logger.error(err);
                logger.info(q_name + ' NO messages to process');
                resolve("NO messages to process")
            }
        })
    })
}

exports.poll_q_sync_hndl = poll_q_sync_hndl
function poll_q_sync_hndl(v) {
    const q_name = v[0];
    const hndl_f = v[1];
    logger.debug('poll_q_1: ' + v[0])
    function process_msg_one(message) {
        return new Promise((resolve) => {
            hndl_f(message)
            .then(res => {
                //msg.
                msg.delete_msg(q_name, message, (err, del_data) => {
                    if (err) logger.error("msg.delete_msg ERROR " + err);
                    resolve("OK")
                });
            })
            .catch(err => { 
                logger.error("ERROR hndl_f: " + err) 
                resolve("hndl_f FAILED")
            } )
        })
    }

    // resolve ONLY
    return new Promise( (resolve) => {
        msg.recv_msg_Q(q_name, (err, data) => {
            if (!err && data.Messages != undefined) {
                return Promise.all( data.Messages.map((message) => {
                    logger.info(q_name + " process: " + message);
                    return process_msg_one(message);
                }) )
            }
            else {
                if (err) logger.error(err);
                logger.info(q_name + ' NO messages to process');
                resolve("NO messages to process")
            }
        })
    })
}

exports.spawn_promised = spawn_promised;
function spawn_promised() {
    var args = Array.prototype.slice.call(arguments);
    return new Promise(function (resolve, reject) {
        var stdout = '', stderr = '';
        var cp = sh.spawn.apply(null, args);
        cp.stdout.on('data', function (chunk) {
            stdout += chunk;
        });
        cp.stderr.on('data', function (chunk) {
            stderr += chunk;
        });
        cp.on('error', reject)
            .on('close', function (code) {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            });
    });
}

exports.mkdir = mkdir;
function mkdir(path) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, 0, function (err) {
            if (err) {
                if (err.code == 'EEXIST') resolve('EEXIST')
                else reject(err)
            } else resolve('mkdir OK')
        });
    });
}

exports.count_process = count_process;
function count_process(p_name) {
    //ps -C chrome --no-headers | wc -l
    return new Promise((resolve, reject) => {
        const sh1 = sh.spawn('ps', ['-C', p_name, '--no-headers']);
        const sh3 = sh.spawn('wc', ['-l']);

        sh1.stdout.pipe(sh3.stdin);

        let result = '';
        sh3.stdout.on('data', (data) => { result += data; });
        sh3.on('close', (code) => {
            if (code === 0) {
                logger.debug('count_process: ' + result);
                resolve(Number(result));
            }
            else {
                logger.error('count_process failed');
                // resolve with empty arr?
                reject('count_process failed');
            }
        });

        sh1.stdin.end();
    });
}
