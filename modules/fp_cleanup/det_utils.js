
const glob = require('glob')
const shortid = require('shortid')
const fs = require('fs')
const path_module = require('path')

const winston = require('winston')
const logger = require('../logger')('DET UTILS')

winston.add(winston.transports.File, {
    filename: 'DET_error.log',
    level: 'error',
    timestamp: true
})

//const storage = require('./storage.js')
//const db = require('./db')
//const { basename, tick, poll_q, mkdir } = require('./util')

//do stuff then change it back

//const mypath = "/home/tsis/data_test/archive/x0/PH/ph55cb3896cf4b5.mp4"
//console.log(basename(mypath))

const SRC_DIR = '/home/tsis/data_test/archive/x0/PH/fp'
const DST_DIR = '/home/tsis/data_test/archive/x0/PH/fp'
const targz = require('targz');
function get_files(src_folder, cb) {
    glob(src_folder + '/*.gz', 
        function(e, f)
        {
            cb(f)
        })
}

function utar_one(src_file, dest_dir, cb) {
    //const dest_dir = path_module.dirname(dest_file)
    targz.decompress({ src: src_file, dest: dest_dir }, (err) => {
        if (err) {
            logger.error("untar failed " + err);
            cb(err)
        } else {
            logger.debug("untar OK");
            cb(null)
        }
    });
}
/*
get_files(SRC_DIR, files => {
    console.log(files)
    files.map(path => {
        let filename = path.replace(/^.*[\\\/]/, '')
        console.log(filename)
        utar_one(path, DST_DIR, err => {
            if (err != null) {
                console.error(err)
            }
            else {
                console.log('OK')
            }
        })
    } )
})
*/

function enum_quant(src_folder, fp, quant_num, cb) {
    glob(src_folder + '/' + fp + '.wav_*_*_' + quant_num + '_*_earid.fp', 
        function(e, f)
        {
            cb(f)
        })
}

function del_quant(src_folder, fp, quant_num) {
    enum_quant(src_folder, fp, quant_num, files => {
        console.log(files)
        files.map(path => {
            fs.unlink(path, err => {
                if (err)
                    console.error(err)
                else
                    console.log("unlink OK")
            })
        })
    })
}

del_quant(SRC_DIR, 'd47210bd.mp4', 0)
del_quant(SRC_DIR, 'd47210bd.mp4', 2)
del_quant(SRC_DIR, 'd47210bd.mp4', 1)
del_quant(SRC_DIR, 'd47210bd.mp4', 3)

del_quant(SRC_DIR, 'ee53a984.mp4', 0)
del_quant(SRC_DIR, 'ee53a984.mp4', 2)

del_quant(SRC_DIR, 'qc2eadcf.mp4', 5)
del_quant(SRC_DIR, 'qc2eadcf.mp4', 7)
del_quant(SRC_DIR, 'qc2eadcf.mp4', 4)
del_quant(SRC_DIR, 'qc2eadcf.mp4', 6)

del_quant(SRC_DIR, 'rbdcfbd7.mp4', 2)
del_quant(SRC_DIR, 'rbdcfbd7.mp4', 3)

del_quant(SRC_DIR, 'x7044908.mp4', 1)
del_quant(SRC_DIR, 'x7044908.mp4', 2)

del_quant(SRC_DIR, 'j08ae422.mp4', 0)
del_quant(SRC_DIR, 'j08ae422.mp4', 1)

del_quant(SRC_DIR, 'g6d7c21a.mp4', 0)
del_quant(SRC_DIR, 'g6d7c21a.mp4', 1)

del_quant(SRC_DIR, 'rbdcfbd7.mp4', 1)
del_quant(SRC_DIR, 'rbdcfbd7.mp4', 5)

del_quant(SRC_DIR, 'x170abd5.mp4', 2)
del_quant(SRC_DIR, 'x170abd5.mp4', 3)

del_quant(SRC_DIR, 'x6d3ba23.mp4', 3)
del_quant(SRC_DIR, 'x6d3ba23.mp4', 0)

del_quant(SRC_DIR, 'y3276ae0.mp4', 8)
del_quant(SRC_DIR, 'y3276ae0.mp4', 6)

del_quant(SRC_DIR, 'kb466c2a.mp4', 1)
del_quant(SRC_DIR, 'kb466c2a.mp4', 2)

// optional
del_quant(SRC_DIR, 'a34ff66a.mp4', 1)
del_quant(SRC_DIR, 'b89224fc.mp4', 1)
del_quant(SRC_DIR, 'f0822030.mp4', 1)
del_quant(SRC_DIR, 'h69ee73c.mp4', 1)
del_quant(SRC_DIR, 'jcc8186a.mp4', 3)
del_quant(SRC_DIR, 'jde15c45.mp4', 0)
del_quant(SRC_DIR, 'n60a1e90.mp4', 4)
del_quant(SRC_DIR, 'q0a9a868.mp4', 1)
del_quant(SRC_DIR, 'x5fe73b8.mp4', 1)
del_quant(SRC_DIR, 'ze5da86a.mp4', 4)

del_quant(SRC_DIR, 'iff1ecf5.mp4', 2)

//?
//del_quant(SRC_DIR, 'gee67006.mp4', 4)
//del_quant(SRC_DIR, 'w7651833.mp4', 7)


/* ??
b13c1acf.mp4.wav,689500,720500,1
d8548826.mp4.wav,689500,720500,0
j49b6de6.mp4.wav,689500,720500,6
k04796ae.mp4.wav,689500,720500,0
m56921f9.mp4.wav,689500,720500,3
x170abd5.mp4.wav,689500,720500,10
*/

// more
del_quant(SRC_DIR, 'w4f0893b.mp4', 1)
del_quant(SRC_DIR, 'w4f0893b.mp4', 3)

del_quant(SRC_DIR, 'k8c6316b.mp4', 6)
del_quant(SRC_DIR, 'k8c6316b.mp4', 0)

del_quant(SRC_DIR, 'f0822030.mp4', 1)
del_quant(SRC_DIR, 'f0822030.mp4', 0)

// .. and more
del_quant(SRC_DIR, 'w5fd60bd.mp4', 3) // 1 ?
del_quant(SRC_DIR, 'qc2eadcf.mp4', 3)