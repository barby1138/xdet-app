const SEARCH_TO_MSEC = 1 * 30 * 60 * 1000; //1h

const USER_ID = 'x0'
const PRIORITY_THRESHOLD = 0
const process_related = false

let total_cnt = 0;
let startKey = null

const mode_test = false

let Searcher = null

const db = require('./db')
const pornsearch = require('pornsearch');

const { tick } = require('./util')
const { promisify } = require('util')
const queryKW_p = promisify(db.queryKW)
const get_dets_limit_p = promisify(db.get_dets_limit)
const queryUrlPH_p = promisify(db.queryUrlPH)
const addUrlPH_p = promisify(db.addUrlPH)

/////////////////////////////////////////////////
// util

function id_parse(tube, url)
{
    if (undefined == url)
        return ""

    let str_to_cut = ''
    let str_id = ""
    if (tube == 'xvideos') {

        str_to_cut = 'xvideos.com/'

        const len = str_to_cut.length
        
        const pos = url.indexOf(str_to_cut)
        if (pos !=-1) 
        {
            str_id = url.substring(pos + len)
        }

        str_id = str_id.split('/')[0]
    }
    else if (tube == 'xhamster') {
        str_to_cut = 'xhamster.com/'

        const len = str_to_cut.length
        
        const pos = url.indexOf(str_to_cut)
        if (pos !=-1) 
        {
            str_id = url.substring(pos + len)
        }

        str_id = str_id.split('/')[1]
        split_arr = str_id.split('-')
        split_arr_len = split_arr.length
        if (split_arr_len > 1)
            str_id = split_arr[split_arr_len - 2] + '-' + split_arr[split_arr_len - 1]
        else if (split_arr_len > 0)
            str_id = split_arr[split_arr_len - 1]
    }
    else if (tube == 'pornhub') {
        str_to_cut = 'pornhub.com/view_video.php?viewkey='
        
        const len = str_to_cut.length
        
        const pos = url.indexOf(str_to_cut)
        if (pos !=-1) 
        {
            str_id = url.substring(pos + len)
        }
    }
    else
        return ""

    return str_id
}

////////////////////////////////////////////////////////////
// private

const tube_config = {
    "pornhub" : { "do_js" : true },
    "xvideos" : { "do_js" : true, "rltd_ceil" : 100 },
    "xhamster" : { "do_js" : true, "videos_ceil" : 40 }
}

async function process_videos_custom_url(tube, url, selector) {
    console.log("process_videos_custom_url")

    if (tube_config[tube].do_js) {  
        return await Searcher.url_video2 (url)
            .then(videos => {
                console.log("videos count: " + videos.length)

                if (tube_config[tube]["videos_ceil"] != undefined)
                    videos = videos.slice(0,tube_config[tube]["videos_ceil"])

                return videos
            })
            .catch(err => { console.log(err) } )
    }
    else {  
        return await Searcher.url_video (url)
            .then(videos => {
                console.log("videos count: " + videos.length)

                if (tube_config[tube]["videos_ceil"] != undefined)
                    videos = videos.slice(0,tube_config[tube]["videos_ceil"])

                return videos
            })
            .catch(err => { console.log(err) } )
    }
}

async function process_videos(tube, query, page) {
    console.log("process_videos")

    if (tube_config[tube].do_js) {                           
        return await Searcher.videos2 (query, page)
                    //Searcher.videos(page)
            .then(videos => {
                console.log("videos count: " + videos.length)
                
                if (tube_config[tube]["videos_ceil"] != undefined)
                    videos = videos.slice(0,tube_config[tube]["videos_ceil"])

                return videos
            })
            .catch(err => { console.log(err) } )
    }
    else {
        return await Searcher.videos (query, page)
            .then(videos => {
                console.log("videos count: " + videos.length)

                if (tube_config[tube]["videos_ceil"] != undefined)
                    videos = videos.slice(0,tube_config[tube]["videos_ceil"])

                return videos
            })
            .catch(err => { console.log(err) } )
    }
}

function process_user_videos(tube, user_name, page) {
    console.log("process_user_videos")
    
    if (tube_config[tube].do_js) {                           
        return Searcher.user_videos2 (user_name, page)
    }
    else {                           
        return Searcher.user_videos (user_name, page)
    }
}

async function process_info_videos(tube, url) {
    console.log("process_info_videos")

    if (tube_config[tube].do_js) {
            return await Searcher.info_video2 (url)
            //return await Searcher._get (it.Analized_chunk_loc, 'relatedVideo')              
            .then(r_data => { 
                //usr = r_data.usr
                //url_2_usr.push({"url":it.Analized_chunk_loc, "usr": usr})

                //console.log(r_data.r_videos)
                if (tube_config[tube]["rltd_ceil"] != undefined)
                    r_data.r_videos = r_data.r_videos.slice(0,tube_config[tube]["rltd_ceil"])
                
                return r_data
            })
            .catch(err => { console.log(err); return null } )
    }
    else {
            return await Searcher.info_video (url)
            .then(r_data => { 

                if (tube_config[tube]["rltd_ceil"] != undefined)
                    r_data.r_videos = r_data.r_videos.slice(0,tube_config[tube]["rltd_ceil"])

                return r_data
            })
            .catch(err => { console.log(err); return null } )
    }
}

function put_all_videos_to_db(tube, all_videos) {
    console.log("process_all_videos") 
    console.log(all_videos.length)
    //console.log(all_videos)

    return Promise.all(all_videos.map(video => {    
        const str_id = id_parse(tube, video.url)
        
        if (str_id.length > 0) 
        {
            //console.log(video.url)
            console.log(str_id)
        }
        else {
            console.log("url: " + video.url)
            //console.log(video)
            console.error("url ID parse failed")
            return new Promise(resolve => { resolve(null) } )
            //callback("url ID parse failed", null)
        }

        if (mode_test == false) {
            return addUrlPH_p(USER_ID, 
                str_id, 
                {
                    "tube":tube,
                    "title":video.title,
                    "kws":video.key,
                    "duration":video.duration,
                    "url":video.url
                })    
                .catch((err) => {
                    //console.error(err) 
                })
        }
        else {
            console.log(tube)
            console.log(video.title)
            console.log(video.key)
            console.log(video.duration)
            console.log(video.url)
    
            return
        }
    }))
}

////////////////////////////////////////////////////////////
// Searcher API

//user_video_search("xhamster", "tubegrest1965")
//user_video_search("pornhub", "aturto")
//user_video_search("pornhub", "technovscars")
async function user_video_search(tube, user_name) {
    Searcher = new pornsearch(tube)
    // TODO init browser inside
    await Searcher.init()

    const pages = [1]

    return await Promise.all(pages.map(page => {
            //console.log(pages)
            //console.log(it)             
            return process_user_videos(tube, user_name, page)
    }))
    .catch(async err => { 
        console.log(err) 
    })
    .then(async res => { 
        console.log(res)  
 
        var all_videos = []

        res.map( it => {
            it.map( video => { all_videos.push(video) } )
        })

        await put_all_videos_to_db(tube, all_videos)
    })
    .finally(async () => {
        await Searcher.close()
    })
}

//kw_search("xhamster")
async function kw_search(tube) {
    Searcher = new pornsearch(tube)
    // TODO init browser inside
    await Searcher.init()
    // todo git rid
    //Searcher.driver(driver = 'pornhub', 'dummy')

    queryKW_p(USER_ID, 10, startKey)
    .then(async (data) => {

        const pages = [1]

        startKey = (data.LastEvaluatedKey != undefined) ? data.LastEvaluatedKey : null

        Promise.all(data.Items.filter( it => { return (it.Priority >= PRIORITY_THRESHOLD) } ).map(async it => {
            console.log("KW: " + it.KW + "  Pr: " + it.Priority)

            return await Promise.all(pages.map(async page => {
                let query = it.KW.replace(/ /g,"+").toLowerCase()
                console.log("page: " + page)
                return await process_videos(tube, query, page)
            }))
            .then(res => { 
                //console.log(res) 
                console.log("done pages") 
                let res1 = res[0]
                
                if (process_related) {
                    return process_info_video(tube, res1)
                }
                else {
                    console.log("skip related")
                    return new Promise( resolve => { resolve(res1) } )
                }
            })
        }))
        .then(async res => {             
            total_cnt += res.length
            console.log("total: " + total_cnt)             

            var all_videos = []

            res.map( it => {
                if (it != null) {
                    it.map( r_video => { all_videos.push(r_video) } )
                }
                else {
                    console.log("dets_related - entry is null")
                }
            })

            await put_all_videos_to_db(tube, all_videos)
    
            if (startKey != null) {
                console.log("again") 
                setTimeout(kw_search.bind(null,tube), 5000);
            }
        })
        .catch((err) => {
            console.error(err) 
        })
        .finally(async () => {
            await Searcher.close()
        })
    
    })
    .catch((err) => {
        console.error(err) 
    })
}

var self_all = []
var all_users = []
var all_channels = []
//dets_related("pornhub")
//dets_related("xvideos")
//dets_related("xhamster")
async function dets_related(tube) {

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtydaysbefore = new Date(startOfDay - 38 * 864e5);

    Searcher = new pornsearch(tube)
    // TODO init browser inside
    await Searcher.init()
    //let url_2_usr = []

    await get_dets_limit_p(USER_ID, 100, startKey)
    .then( (data) => {

        startKey = (data.LastEvaluatedKey != undefined) ? data.LastEvaluatedKey : null

        data.Items = data .Items.filter(it => it.Analized_chunk_TS > thirtydaysbefore)
                                .filter( it => it.Accept_status != 'rejected' && it.Feed_title == tube)
        let res = data.Items//.slice(200,400)
        //let res = [data.Items[0],data.Items[1],data.Items[2]]
        //let res = [data.Items[2]]
        return Promise.all(res .map(it => {
            console.log(it.Analized_chunk_loc)
    
            return process_info_videos(tube, it.Analized_chunk_loc)
        }))
    })
    .then(async res => { 
        var all_videos = []

        res.map( it => {
            if (it != null) {
                console.log(it.self)
                if (it.self.usr.name != '') {
                    if (it.self.usr.type == 'user') {
                        if (all_users[it.self.usr.url] == undefined)
                            all_users[it.self.usr.url] = 1
                    }
                    else if (it.self.usr.type == 'channel') {
                        if (all_channels[it.self.usr.url] == undefined)
                        all_channels[it.self.usr.url] = 1
                    }
                }
                //console.log(it.r_videos)

                //var init_video = {"url" : it.self.url, "key" : "init", "duration" : "00:00", "title": it.self.title}
                //all_videos.push(init_video)

                it.r_videos.map( r_video => { all_videos.push(r_video) } )

                //self_all.push(it.self)
            }
            else {
                console.log("dets_related - entry is null")
            }
        })

        await put_all_videos_to_db(tube, all_videos)
        
        if (startKey != null) {
            console.log("again") 
            setTimeout(dets_related.bind(null,tube), 5000);
        }
        else 
        {
            //console.log(self_all)
            console.log(all_users)
            console.log(all_channels)
        }

    })
    .catch((err) => {
        console.error(err) 
    })
    .finally(async () => {
        await Searcher.close()
    })
}

function xh_stars_url_2_key(url) {
    let key = ""
    const pos = url.indexOf("https://xhamster.com/")
    if (pos !=-1) 
    {
        key = url.substring(pos + ("https://xhamster.com/").length).replace("/", ":")
    }
    console.log(key) 
    return key
}

//url_search(xh_categories, "xhamster")
//url_search(xh_models, "xhamster")
async function url_search(tube, urls, url_2_key_cb) {
    Searcher = new pornsearch(tube)
    // TODO init browser inside
    await Searcher.init()

    //let videos_total = []

    await Promise.all(urls.map(async it => {
        console.log("url: ")
        console.log("url: " + it)
   
        key = url_2_key_cb(it)

        // TODO review hide selector in side
        return await process_videos_custom_url(tube, it, '.thumb-list__item.video-thumb')
            .then(res => { 
                console.log("done pages") 
                console.log(res.length)

                if (process_related) {
                    return process_info_video(tube, res)
                }
                else {
                    console.log("skip related")
                    return new Promise( resolve => { resolve(res) } )
                }
            })
    }))
    .then(async res => {
        var all_videos = []

        res.map( it => {
            console.log(it.self)
            console.log(it.r_videos)

            //var init_video = {"url" : it.self.url, "key" : "init", "duration" : "00:00", "title": it.self.title}
            //all_videos.push(init_video)

            it.r_videos.map( r_video => { all_videos.push(r_video) } )
        })

        await put_all_videos_to_db(tube, all_videos)
    })
    .finally(async () => {
        await Searcher.close()
    })
}

async function url_content_and_related(tube, urls) {
    Searcher = new pornsearch(tube)
    // TODO init browser inside
    await Searcher.init()

    const pages = [1]

    await Promise.all(urls .map(it => {
        console.log(it.url)

        return process_info_videos(tube, it.url)
    }))
    .then(async res => { 

        var all_videos = []
        res.map( it => {
            console.log(it.self)
            //console.log(it.r_videos)

            var init_video = {"url" : it.self.url, "key" : "init", "duration" : "00:00", "title": it.self.title}
            all_videos.push(init_video)

            it.r_videos.map( r_video => { all_videos.push(r_video) } )
        })

        await put_all_videos_to_db(tube, all_videos)
    })
    .finally(async () => {
        await Searcher.close()
    })
}

///////////////////////////////////////////
// data
const xh_categories = [
    'https://xhamster.com/categories/18-year-old',
    'https://xhamster.com/categories/anal',
    'https://xhamster.com/categories/babe',
    'https://xhamster.com/categories/beach',
    'https://xhamster.com/categories/big-natural-tits',
    'https://xhamster.com/categories/big-tits',
    'https://xhamster.com/categories/blonde',
    'https://xhamster.com/categories/casting',
    'https://xhamster.com/categories/cfnm',
    'https://xhamster.com/categories/close-up',
    'https://xhamster.com/categories/college',
    'https://xhamster.com/categories/cowgirl',
    'https://xhamster.com/categories/creampie',
    'https://xhamster.com/categories/cum-in-mouth',
    'https://xhamster.com/categories/cum-swallowing',
    'https://xhamster.com/categories/cumshot',
    'https://xhamster.com/categories/cunnilingus',
    'https://xhamster.com/categories/doggy-style',
    'https://xhamster.com/categories/facesitting',
    'https://xhamster.com/categories/facial',
    'https://xhamster.com/categories/gangbang',
    'https://xhamster.com/categories/girl-masturbating',
    'https://xhamster.com/categories/group-sex',
    'https://xhamster.com/categories/hairy',
    'https://xhamster.com/categories/handjob',
    'https://xhamster.com/categories/hardcore',
    'https://xhamster.com/categories/lesbian',
    'https://xhamster.com/categories/massage',
    'https://xhamster.com/categories/orgasm',
    'https://xhamster.com/categories/outdoor',
    'https://xhamster.com/categories/porn-for-women',
    'https://xhamster.com/categories/pornstar',
    'https://xhamster.com/categories/skinny',
    'https://xhamster.com/categories/small-tits',
    'https://xhamster.com/categories/teen',
    'https://xhamster.com/categories/threesome',
    'https://xhamster.com/categories/tight-pussy',
    'https://xhamster.com/categories/top',
    'https://xhamster.com/categories/wife-sharing',
    'https://xhamster.com/hd',
    'https://xhamster.com/vr'
    ]    

    const xh_models = [
        "https://xhamster.com/pornstars/aimee-ryan",
        "https://xhamster.com/pornstars/alexis-crystal",
        "https://xhamster.com/pornstars/angie-koks",
        "https://xhamster.com/pornstars/anina-silk",
        "https://xhamster.com/pornstars/ann-marie",
        "https://xhamster.com/pornstars/anna-lee",
        "https://xhamster.com/pornstars/anna-tatu",
        "https://xhamster.com/pornstars/aria-alexander",
        "https://xhamster.com/pornstars/ariadna",
        "https://xhamster.com/pornstars/barbara-sweet",
        "https://xhamster.com/pornstars/bella-baby",
        "https://xhamster.com/pornstars/candice-luca",
        "https://xhamster.com/pornstars/candy-sweet",
        "https://xhamster.com/pornstars/carli-banks",
        "https://xhamster.com/pornstars/carolina-abril",
        "https://xhamster.com/pornstars/celeste-star",
        "https://xhamster.com/pornstars/charlie-laine",
        "https://xhamster.com/pornstars/chastity-lynn",
        "https://xhamster.com/pornstars/cherry-pink",
        "https://xhamster.com/pornstars/dakota-skye",
        "https://xhamster.com/pornstars/dani-daniels",
        "https://xhamster.com/pornstars/daniella-rose",
        "https://xhamster.com/pornstars/denisa-heaven",
        "https://xhamster.com/pornstars/dream-july",
        "https://xhamster.com/pornstars/dulce",
        "https://xhamster.com/pornstars/elle-alexandra",
        "https://xhamster.com/pornstars/emma-stoned",
        "https://xhamster.com/pornstars/eufrat",
        "https://xhamster.com/pornstars/georgia-jones",
        "https://xhamster.com/pornstars/gina-gerson",
        "https://xhamster.com/pornstars/shrima-malati",
        "https://xhamster.com/pornstars/holly-michaels",
        "https://xhamster.com/pornstars/iris",
        "https://xhamster.com/pornstars/izzy-delphine",
        "https://xhamster.com/pornstars/jana-cova",
        "https://xhamster.com/pornstars/jana-jordan",
        "https://xhamster.com/pornstars/jenny-smart",
        "https://xhamster.com/pornstars/jessie-rogers",
        "https://xhamster.com/pornstars/joseline-kelly",
        "https://xhamster.com/pornstars/kasey-chase",
        "https://xhamster.com/pornstars/kiara-lord",
        "https://xhamster.com/pornstars/leila-smith",
        "https://xhamster.com/pornstars/lela-star",
        "https://xhamster.com/pornstars/lexi-belle",
        "https://xhamster.com/pornstars/linda-sweet",
        "https://xhamster.com/pornstars/lindsay-marie",
        "https://xhamster.com/pornstars/lucy-li",
        "https://xhamster.com/pornstars/madonna",
        "https://xhamster.com/celebrities/madonna",
        "https://xhamster.com/pornstars/maggie-gold",
        "https://xhamster.com/pornstars/malena-morgan",
        "https://xhamster.com/pornstars/maria-pie",
        "https://xhamster.com/pornstars/mia-sollis",
        "https://xhamster.com/pornstars/milana",
        "https://xhamster.com/pornstars/mindy",
        "https://xhamster.com/pornstars/natalia-star",
        "https://xhamster.com/pornstars/natalia-starr",
        "https://xhamster.com/pornstars/natasha-von",
        "https://xhamster.com/pornstars/nathalie-von",
        "https://xhamster.com/pornstars/nekane",
        "https://xhamster.com/pornstars/nomi",
        "https://xhamster.com/celebrities/nomi",
        "https://xhamster.com/pornstars/sasha-rose",
        "https://xhamster.com/pornstars/pantera",
        "https://xhamster.com/pornstars/paula-shy",
        "https://xhamster.com/pornstars/christy-charming",
        "https://xhamster.com/pornstars/prinzzess",
        "https://xhamster.com/pornstars/riley-reid",
        "https://xhamster.com/pornstars/rossy-bush",
        "https://xhamster.com/pornstars/sapphire",
        "https://xhamster.com/pornstars/silvie-luca",
        "https://xhamster.com/pornstars/tali-dova",
        "https://xhamster.com/pornstars/tiffany-fox",
        "https://xhamster.com/pornstars/veronica-rodriguez",
        "https://xhamster.com/pornstars/marina-visconti",
        "https://xhamster.com/pornstars/vinna-reed",
        "https://xhamster.com/pornstars/violette",
        "https://xhamster.com/pornstars/zoey-kush",
        "https://xhamster.com/pornstars/alex-tanner",
        "https://xhamster.com/pornstars/alexa-tomas",
        "https://xhamster.com/pornstars/alexis-adams",
        "https://xhamster.com/pornstars/alice-green",
        "https://xhamster.com/pornstars/alice-march",
        "https://xhamster.com/pornstars/alina-west",
        "https://xhamster.com/pornstars/anny-aurora",
        "https://xhamster.com/pornstars/antonia-sainz",
        "https://xhamster.com/pornstars/apolonia",
        "https://xhamster.com/pornstars/ava-taylor",
        "https://xhamster.com/pornstars/chloe-foster",
        "https://xhamster.com/pornstars/emily-grey",
        "https://xhamster.com/pornstars/erica-fox",
        "https://xhamster.com/pornstars/foxi-di",
        "https://xhamster.com/pornstars/foxy-di",
        "https://xhamster.com/pornstars/jenna-ross",
        "https://xhamster.com/pornstars/kacey-jordan",
        "https://xhamster.com/pornstars/kendall-karson",
        "https://xhamster.com/pornstars/kitty-jane",
        "https://xhamster.com/pornstars/lady-d",
        "https://xhamster.com/pornstars/lexi-dona",
        "https://xhamster.com/pornstars/maci-winslett",
        "https://xhamster.com/pornstars/megan-rain",
        "https://xhamster.com/pornstars/michaela-isizzu",
        "https://xhamster.com/pornstars/nancy-a",
        "https://xhamster.com/pornstars/natalie-heart",
        "https://xhamster.com/pornstars/nina-north",
        "https://xhamster.com/pornstars/rachel-james",
        "https://xhamster.com/pornstars/samantha-rone",
        "https://xhamster.com/pornstars/serena-wood",
        "https://xhamster.com/pornstars/stella-daniels",
        "https://xhamster.com/pornstars/talia-mint",
        "https://xhamster.com/pornstars/taylor-sands",
        "https://xhamster.com/pornstars/timea-bella",
        "https://xhamster.com/pornstars/veronica-radke",
        "https://xhamster.com/pornstars/victoria",
        "https://xhamster.com/amateurs/victoria",
        "https://xhamster.com/pornstars/victoria-sweet",
        "https://xhamster.com/pornstars/evelina-darling",
        "https://xhamster.com/pornstars/chloe-couture",
        "https://xhamster.com/pornstars/elsa-jean",
        "https://xhamster.com/pornstars/leah-gotti",
        "https://xhamster.com/pornstars/naomi-woods",
        "https://xhamster.com/pornstars/kimmy-granger",
        "https://xhamster.com/pornstars/yarina-a",
        "https://xhamster.com/pornstars/milena-devi",
        "https://xhamster.com/pornstars/mary-kalisy",
        "https://xhamster.com/pornstars/alex-grey",
        "https://xhamster.com/pornstars/kylie-quinn",
        "https://xhamster.com/pornstars/alaina-dawson",
        "https://xhamster.com/pornstars/chelsy-sun",
        "https://xhamster.com/pornstars/cherry-bright",
        "https://xhamster.com/pornstars/monika-benz",
        "https://xhamster.com/pornstars/sofia-like",
        "https://xhamster.com/pornstars/kristy-black",
        "https://xhamster.com/pornstars/anna-rose",
        "https://xhamster.com/pornstars/ana-rose",
        "https://xhamster.com/pornstars/katarina-muti",
        "https://xhamster.com/pornstars/mila-azul",
        "https://xhamster.com/pornstars/emily-thorne",
        "https://xhamster.com/pornstars/sarah-kay",
        "https://xhamster.com/pornstars/katy-rose",
        "https://xhamster.com/pornstars/cassie-fire",
        "https://xhamster.com/pornstars/teressa-bizarre",
        "https://xhamster.com/pornstars/daphne-klyde",
        "https://xhamster.com/pornstars/katy-sky",
        "https://xhamster.com/pornstars/nikki-waine",
        "https://xhamster.com/pornstars/eveline-dellai",
        "https://xhamster.com/pornstars/daisy-lee",
        "https://xhamster.com/pornstars/anna-swix",
        "https://xhamster.com/pornstars/alecia-fox",
        "https://xhamster.com/pornstars/lady-bug",
        "https://xhamster.com/pornstars/melissa-benz",
        "https://xhamster.com/pornstars/melissa-grand",
        "https://xhamster.com/pornstars/anie-darling",
        "https://xhamster.com/pornstars/silvia-dellai",
        "https://xhamster.com/pornstars/paris-devine",
        "https://xhamster.com/pornstars/arwen-gold",
        "https://xhamster.com/pornstars/baby-dream",
        "https://xhamster.com/pornstars/stefanie-moon",
        "https://xhamster.com/pornstars/stephanie-moon",
        "https://xhamster.com/pornstars/arteya",
        "https://xhamster.com/pornstars/sade-mare",
        "https://xhamster.com/pornstars/elle-rose",
        "https://xhamster.com/pornstars/cindy-shine",
        "https://xhamster.com/pornstars/lena-reif",
        "https://xhamster.com/pornstars/jia-lissa",
        "https://xhamster.com/pornstars/charli-red",
        "https://xhamster.com/pornstars/charlie-red",
        "https://xhamster.com/pornstars/lovita-fate",
        "https://xhamster.com/pornstars/leanne-lace"
        ]  

const wow_content = [
    {"url" : "https://xhamster.com/videos/hardcore-12754-10864500#mlrelated", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/65-11809992#mlrelated", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/hardcore-13196-11305330#mlrelated", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/angelica-fucks-by-the-pool-11565083#mlrelated", "key" : "init",
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/skinny-model-fucks-her-two-lovers-11772541#mlrelated", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/teen-with-great-boobs-get-fucked-by-her-boyfriend-11568067#mlrelated", "key" : "init",
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/colse-up-pussy-peeing-6801487", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/teen-fucked-good-5014310#mlrelated", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/sunday-sweets-3241983", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/mn-sim-3016075", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/yootz201-6452457", "key" : "init", 
        "duration" : "", "title": ""},
    
    {"url" : "https://xhamster.com/videos/lesbian-lovers-8-3076331#mlrelated", "key" : "init", 
        "duration" : "", "title": ""}
    ]

///////////////////////////////////////////
// tests
const test_urls = [

{"url" : "https://xhamster.com/videos/yootz201-6452457", "key" : "init", 
    "duration" : "", "title": ""},

{"url" : "https://xhamster.com/videos/lesbian-lovers-8-3076331#mlrelated", "key" : "init", 
    "duration" : "", "title": ""}
]
//url_content_and_related("xhamster", wow_content)

const test_xh_models = [
    "https://xhamster.com/pornstars/aimee-ryan"
]
//url_search("xhamster", test_xh_models, xh_stars_url_2_key)

//dets_related("pornhub")
//dets_related("xvideos")
//dets_related("xhamster")

//kw_search("xvideos")
//kw_search("pornhub")
//kw_search("xhamster")

const xh_users = [
    "LeeHann",
    "LaraLovely",
    "pusztapunk",
    "carllp2000",
    "carllp2000",
    "draciro",
    "BoobsExquis",
    "JustHornyNow",
    "blasphomy123",
    "xxxstokkazzo10",
    "MrSecrect",
    "xxxstokkazzo6",
    
    "jodale2100",
    "ironD",
    "RogerSmith",
    "hdvids",
    "donkies",
    "Michael-kenyon",
    "lezfan4life",
    "hamsterdamm",
    "nono1555",
    "technovscars"
]

const xh_users_test = [
    "xxxstokkazzo10",
    "MrSecrect",
    "xxxstokkazzo6",
]


const ph_users_test = [ 'aroosatabeer',
  'nudebarbarian'
]

const ph_users = [ 'aroosatabeer',
  'nudebarbarian',
  //'pornhub',
  'sextronix',
  'pronnerdasia',
  'jokerx133',
  'meow_98',
  'mcelraft',
  'fatalgirls',
  'sextermedia',
  'snejanna',
  'njdjpj',
  'blue_devil957',
  'sir_murch',
  'mamattattix',
  'karhu2',
  'janssen146',
  'antiterane',
  'skinnyfan2019',
  'hellochicken',
  'otilio',
  'pxrnlxver',
  'coleccionador',
  'estonianfeetlover',
  'x4n4-fl4sh1',
  'zigatron',
  'tubesurfertony',
  'thegoomster',
  'officialporn3231',
  'xxsw3glordxx',
  '2049',
  'marymay11',
  'sideorderofanal',
  'margorobi95',
  'andry-e',
  'bestnatin',
  'teenwhore16',
  'masteralex27',
  'gdfucker34',
  'spegial01',
  'fuckoffasshole22',
  'anny95',
  'stripondesktop',
  'itwt',
  'doctor_sex',
  'sendmepm',
  'dimapro81',
  'kiwijacker',
  'tobey-for-real',
  'porkyfan2019',
  'vasiliy91',
  'box88',
  'felationmania',
  'doctorporno69',
  'jaypeterson',
  'lithium98',
  'b_sommers',
  'nalram',
  'swetty',
  'mrsnooker',
  'dnnndftw',
  'paul1427',
  'onchannel',
  'kaif111',
  'sick_rabbit',
  'danekut',
  'hotadult',
  'jdawg1015',
  'z-bones69',
  'themaven',
  'fortyonefour',
  'cmardle',
  'minnesota_kid',
  'special777'
]

function user_video_search_wrp(tube, dict, ind) {
    
    if (dict[ind] == undefined) {
        console.log('users DONE')
        return
    }

    user_video_search(tube, dict[ind])
    .finally( () => {
        console.log('next')
        user_video_search_wrp(tube, dict, ind+1)
    })
      
}
//user_video_search_wrp("xvideos", xv_users, 0)

//user_video_search_wrp("pornhub", ph_users, 0)
//user_video_search_wrp("xhamster", xh_users, 0)



//user_video_search("xhamster", "jodale2100")
//user_video_search("xhamster", "ironD")
//user_video_search("xhamster", "RogerSmith")
//user_video_search("xhamster", "hdvids")
//user_video_search("xhamster", "donkies")
//user_video_search("xhamster", "Michael-kenyon")
//user_video_search("xhamster", "lezfan4life")
//user_video_search("xhamster", "hamsterdamm")
//user_video_search("xhamster", "nono1555")

//user_video_search("pornhub", "technovscars")
//user_video_search("pornhub", "avmedicinehead")


//user_video_search("xvideos", "Romanboobs")


