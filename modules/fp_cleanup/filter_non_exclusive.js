const glob = require('glob')
//const shortid = require('shortid')
const fs = require('fs')
const path_module = require('path')

//const winston = require('winston')
const logger = require('../logger')('DET UTILS')

const SRC_DIR = '/home/tsis/data_test/archive/x0/PH/fp'
const DST_DIR = '/home/tsis/data_test/archive/x0/PH/fp'

function get_files(src_folder, cb) {
    glob(src_folder + '/*.gz', 
        function(e, f)
        {
            cb(f)
        })
}

//var fs = require('fs');
let dict = []
let to_unlink = []
let array = fs.readFileSync('modules/fp_cleanup/afg-wp-hashes.txt').toString().split("\n")
for(i in array) {
    //console.log(array[i])
    dict[array[i]] = 1
}


function enum_quant(src_folder, fp, cb) {
    glob(src_folder + '/' + fp + '.*', 
        function(e, f)
        {
            cb(f)
        })
}

function del_quant(src_folder, fp) {
    enum_quant(src_folder, fp, files => {
        //console.log("unlink " + files)
        
        files.map(path => {
            fs.unlink(path, err => {
                if (err)
                    console.error(err)
                //else
                    //console.log("unlink OK")
            })
        })
        
    })
}

get_files(SRC_DIR, files => {
    //console.log(files)
    files.map(path => {
        let filename = path.replace(/^.*[\\\/]/, '')
        let name = filename.split('.')[0]
        if (dict[name] != undefined) {
            //console.log("!!! " + name)
            to_unlink.push(name)
        }
    } )

    console.log(to_unlink.length)

    to_unlink.map(name => {
        del_quant(SRC_DIR, name)
    })
})

