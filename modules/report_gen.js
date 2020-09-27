
const USER_ID = "x0"

const winston = require('winston')
//const logger = require('./logger')('XDET-DL-CALLER')

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

//const { promisify } = require('util')
const get_dets_p = promisify(db.get_dets)
const get_marker_p = promisify(db.getMarker)

const fs = require('fs')
const json2csv = require('json2csv').parse

dump()
function dump()
{
    const output = fs.createWriteStream("mu.csv", { encoding: 'utf8' });
    //const fields = ['Path', 'Tube'];
    const fields = [/*'Accept_status',*/ 'Analized_chunk_loc', 'Title', "Begin_shift", "End_shift", "Track_title", 'Type'];
    //const fields = ['UserID', 'KW', 'Priority'];
    const opts = { fields };

    //queryUrlPH_p(USER_ID)
    get_dets_p(USER_ID)
    //queryKW_p(USER_ID, 0, null)
    .then(async (data) => { 
        //console.log(data)
        dets = data.Items.filter( it => it.Accept_status != 'rejected' )

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(startOfDay - 1 * 864e5);
        const sevendaysbefore = new Date(startOfDay - 10 * 864e5);
        const thirtydaysbefore = new Date(startOfDay - 30 * 864e5);

        const unique_dets_today = dets.filter(it => it.Analized_chunk_TS > startOfDay)
            .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])

        const unique_dets_yesterday = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > yesterday)
            .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])

        const unique_dets_sevendays = dets.filter(it => it.Analized_chunk_TS > sevendaysbefore)
            .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])

        const unique_dets_thirtydays = dets.filter(it => it.Analized_chunk_TS > sevendaysbefore) //thirtydaysbefore)
            .filter( function foo(it) {
                if ( typeof foo.flags == 'undefined' ) {
                    // It has not... perform the initialization
                    foo.flags = [];
                }
                if(foo.flags[it.Analized_chunk_loc]) {
                    //not_flags[it.Analized_chunk_loc] = true;
                    return false;
                }
                foo.flags[it.Analized_chunk_loc] = true;
                return true;
            })
            
        const res = await Promise.all(unique_dets_thirtydays.map(it => {           
                return new Promise( resolve => {
                    get_marker_p(USER_ID, it.Track_title)
                    .then(marker => {
                        it.Title = marker.Items[0].Title
                        console.log(it.Title)
                        resolve(it)
                    })
                    .catch(err => {
                        console.log("error")
                        it.Title = "<empty>"
                        resolve(it)
                    })
                })
        }))

        //console.log(unique_dets_thirtydays)
        const csv = json2csv(res, opts)
        console.log(csv)
        output.write(csv)
        output.end()
    })
    .catch((err) => {
        console.error(err) 
    })
}
