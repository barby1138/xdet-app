//cfg?
const QUERY_URLPH_STEP = 20

const logger = require('./logger')('DB')

const tableDetections = 'xdet_Detections'
const tableUrlsPH = 'xdet_UrlsPH'
const tableKeyWords = 'xdet_KeyWords'
const tableConfig = 'xdet_Config'
const tableTubes = 'xdet_Tubes'
const tableMarkers = 'xdet_Markers'

const shortid = require('shortid')

const AWS = require('aws-sdk')
AWS.config.loadFromPath('./modules/awsConfig.js')

const ddb = new AWS.DynamoDB()
const ddb_docclient = new AWS.DynamoDB.DocumentClient()

//addConfig('x0', function (err, res) { console.log(err) } )
function addConfig(userID, callback) {
    logger.info('addConfig');

    const createTS = Date.now();
    const updateTS = Date.now();

    const params = {
        TableName: tableConfig,
        Item: {
            "UserID": userID,
            // DL
            "DLMaxCnt": 2,
            "DLMaxRetries": 3,
            // DL caller
            "DLQMaxThshld": 100,
            "DLQMinThshld": 200,
            // logger
            "LogLevel": "info"
        },
        ConditionExpression: "#UserID <> :UserID",
        ExpressionAttributeNames: { 
            "#UserID" : "UserID" 
        },
        ExpressionAttributeValues: {
            ":UserID" : userID
        }
    }
    
    ddb_docclient.put(params, function (err, data) {
        if (err) {
            logger.error("addConfig Unable to put item. Error:", JSON.stringify(err))
            callback(err, null)
        }
        else {
            logger.info("addConfig put item OK:", JSON.stringify(params.Item))
            callback(err, params.Item)
        }
    })
}

//////////////////////////////////////////
// KW

exports.addKW = addKW
function addKW(userID, data, callback) {
    logger.info('addKW');

    const createTS = Date.now();
    const updateTS = Date.now();

    const params = {
        TableName: tableKeyWords,
        Item: {
            "UserID": userID,
            "KW": data.KW,
            "CreateTS": createTS,
            "Priority": data.priority, // ex. priority = -1 - not active
        },
        ConditionExpression: "#KW <> :KW",
        ExpressionAttributeNames: { 
            "#KW" : "KW" 
        },
        ExpressionAttributeValues: {
            ":KW" : data.KW
        }
    }
    
    ddb_docclient.put(params, function (err, data) {
        if (err) {
            logger.error("addKW Unable to put item. Error:", JSON.stringify(err))
            callback(err, null)
        }
        else {
            logger.info("addKW put item OK:", JSON.stringify(params.Item))
            callback(err, params.Item)
        }
    })
}

exports.queryKW = queryKW
function queryKW(userID, limit, startKey, callback) {
    logger.info('queryKW');

    const params = {
        TableName: tableKeyWords,
        KeyConditionExpression: "#UserID = :UserID",
        ExpressionAttributeNames: {
            "#UserID": "UserID"
        },
        ExpressionAttributeValues: {
            ":UserID": userID
        }
    };

    if (limit > 0) params.Limit = limit
    if (startKey != null) params.ExclusiveStartKey = startKey

    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("queryKW Unable to query item. Error:", JSON.stringify(err));
        } else {
            logger.info("queryKW OK:", JSON.stringify(data));
        }

        callback(err, data);
    });
}

//////////////////////////////////////////
// Markers

exports.addMarker = addMarker
function addMarker(userID, data, callback) {
    logger.info('addMarker');

    const createTS = Date.now();

    const params = {
        TableName: tableMarkers,
        Item: {
            "UserID": userID,
            "Marker": data.Marker,
            "Title": data.Title,
            "CreateTS": createTS
        },
        ConditionExpression: "#Marker <> :Marker",
        ExpressionAttributeNames: { 
            "#Marker" : "Marker" 
        },
        ExpressionAttributeValues: {
            ":Marker" : data.Marker
        }
    }
    
    ddb_docclient.put(params, function (err, data) {
        if (err) {
            logger.error("addMarker Unable to put item. Error:", JSON.stringify(err))
            callback(err, null)
        }
        else {
            logger.info("addMarker put item OK:", JSON.stringify(params.Item))
            callback(err, params.Item)
        }
    })
}

exports.queryMarkers = queryMarkers
function queryMarkers(userID, limit, startKey, callback) {
    logger.info('queryMarkers');

    const params = {
        TableName: tableMarkers,
        KeyConditionExpression: "#UserID = :UserID",
        ExpressionAttributeNames: {
            "#UserID": "UserID"
        },
        ExpressionAttributeValues: {
            ":UserID": userID
        }
    };

    if (limit > 0) params.Limit = limit
    if (startKey != null) params.ExclusiveStartKey = startKey

    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("queryMarkers Unable to query item. Error:", JSON.stringify(err));
        } else {
            logger.info("queryMarkers OK:", JSON.stringify(data));
        }

        callback(err, data);
    });
}

exports.getMarker = getMarker
function getMarker(userID, marker, callback) {
    logger.info('getMarker');

    const params = {
        TableName: tableMarkers,
        KeyConditionExpression: "#UserID = :UserID and #Marker = :Marker",
        ExpressionAttributeNames: {
            "#UserID": "UserID",
            "#Marker": "Marker"
        },
        ExpressionAttributeValues: {
            ":UserID": userID,
            ":Marker": marker
        }
    };

    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("getMarker Unable to query item. Error:", JSON.stringify(err));
        } else {
            logger.info("getMarker OK:", JSON.stringify(data));
        }

        callback(err, data);
    });
}

////////////////////////////////////////
// PH URL

/*
addUrlPH('x0', {
    "PHID":"222",
    "title":"t",
    "tags":"ta",
    "duration":222,
    "url":"u"
}, function (err, res) { console.log(err) } )
*/
exports.addUrlPH = addUrlPH
function addUrlPH(userID, PHID, data, callback) {
    logger.info('addUrlPH');

    const createTS = Date.now();
    const updateTS = Date.now();

    const params = {
        TableName: tableUrlsPH,
        Item: {
            "UserID": userID,
            "PHID": PHID,
            "Tube": data.tube,
            "Title": data.title,
            "Duration": (data.duration == "") ? "N/A" : data.duration,
            "KWs": data.kws,
            "Path": data.url,
            "CreateTS": createTS,
            "UpdateTS": updateTS,
            "ProcState": "idle", //queued / downloaded / processed / error
            "ProcStateDescr": "descr",
            "DLRetryCnt": 0,
            "Dl_TS": 0,
            "Dl_size": 0,
            "Q_TS": 0,
            "Proc_TS": 0
        },
        ConditionExpression: "#PHID <> :PHID",
        ExpressionAttributeNames: { 
            "#PHID" : "PHID" 
        },
        ExpressionAttributeValues: {
            ":PHID" : PHID
        }
    }
    
    ddb_docclient.put(params, function (err, data) {
        if (err) {
            if (err.code != "ConditionalCheckFailedException")
            {
                console.log(err)
                logger.error("addUrlPH Unable to put item. Error:", JSON.stringify(err))
            }
            callback(err, null)
        }
        else {
            logger.info("addUrlPH put item OK:", JSON.stringify(params.Item))
            callback(err, params.Item)
        }
    })
}

/*
exports.cleanUrlPH = cleanUrlPH;
function cleanUrlPH(userID, callback) {
    logger.info('cleanUrlPH');

    const params = {
        TableName: tableUrlsPH,
        Key: {
            "UserID": userID
        }
    }

    ddb_docclient.delete(params, function (err, del_data) {
        if (err) {
            logger.error("cleanUrlPH Unable to remove item. Error:" + JSON.stringify(err))
        } else {
            logger.info("cleanUrlPH remove OK:" + JSON.stringify(del_data))
        }

        callback(err, del_data)
    })
}
*/

exports.queryUrlPH = queryUrlPH
function queryUrlPH(userID, callback) {
    logger.info('queryDlCaller_startTS');

    let startKey = null
    const params = {
        TableName: tableUrlsPH,
        KeyConditionExpression: "#UserID = :UserID",
        ExpressionAttributeNames: {
            "#UserID": "UserID"
        },
        ExpressionAttributeValues: {
            ":UserID": userID
        }
    };
    
    let results = { "Items" : [] };

    function on_query(err, data) {
        if (err) {
            logger.error("queryUrlPH Unable to query item. Error:", JSON.stringify(err));
            callback(err, results)
        } else {
            //logger.info("queryUrlPH OK:", JSON.stringify(data));
            results["Items"] = results["Items"].concat(data.Items)
            console.log(results["Items"].length)

            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("query for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                ddb_docclient.query(params, on_query)
            }
            else {
                callback(err, results)
            }
        }
    }

    ddb_docclient.query(params, on_query)
    /*
    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("queryUrlPH Unable to query item. Error:", JSON.stringify(err));
        } else {
            logger.info("queryUrlPH OK:", JSON.stringify(data));
        }

        if (data)
        callback(err, data);
    })
    */
}

// local use in add det to get url by id
//exports.queryUrlPH = queryUrlPH
function getUrlPH(userID, PHID, callback) {
    logger.info('queryDlCaller_startTS');

    let startKey = null
    const params = {
        TableName: tableUrlsPH,
        KeyConditionExpression: "#UserID = :UserID and #PHID = :PHID",
        ExpressionAttributeNames: {
            "#UserID": "UserID",
            "#PHID" : "PHID" 
        },
        ExpressionAttributeValues: {
            ":UserID": userID,
            ":PHID" : PHID 
        }
    };
    
    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("queryUrlPH Unable to query item. Error:", JSON.stringify(err));
        } else {
            logger.info("queryUrlPH OK:", JSON.stringify(data));
        }

        callback(err, data);
    })
}

exports.queryUrlPH_idxProcState = queryUrlPH_idxProcState
function queryUrlPH_idxProcState(userID, procState, limit, startKey, callback) {
    logger.info('queryDlCaller_startTS');

    const params = {
        TableName: tableUrlsPH,
        IndexName: "UserID-ProcState-index",
        KeyConditionExpression: "#UserID = :UserID AND #ProcState = :ProcState",
        ExpressionAttributeNames: {
            "#UserID": "UserID",
            "#ProcState": "ProcState"
        },
        ExpressionAttributeValues: {
            ":UserID": userID,
            ":ProcState": procState
        }
    };

    if (limit > 0) {
        params.Limit = limit
        if (startKey != null) params.ExclusiveStartKey = startKey

        ddb_docclient.query(params, function (err, data) {
            if (err) {
                logger.error("queryUrlPH_idxProcState Unable to query item. Error:", JSON.stringify(err));
            } else {
                logger.info("queryUrlPH_idxProcState OK:", JSON.stringify(data));
            }

            callback(err, data);
        });
    }
    else {
        let results = { "Items" : [] };

        function on_query(err, data) {
            if (err) {
                logger.error("queryUrlPH_idxProcState Unable to query item. Error:", JSON.stringify(err));
                callback(err, results)
            } else {
                //logger.info("queryUrlPH_idxProcState OK:", JSON.stringify(data));
                results["Items"] = results["Items"].concat(data.Items)
                console.log(results["Items"].length)
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("query for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    ddb_docclient.query(params, on_query)
                }
                else {
                    console.log("cb")
                    callback(err, results)
                }
            }
        }
    
        ddb_docclient.query(params, on_query)
    }
}

//updateUrlPH_procState('x0', "0000", "downloaded", {"size" : 700}, function (err, res) { console.log(err) } )
exports.updateUrlPH_procState = updateUrlPH_procState
function updateUrlPH_procState(userID, PHID, procState, data, callback) {
    logger.info('addUrlPH')

    //logger.info(userID + ' ' + PHID + ' ' + procState + ' ' + data)

    const updateTS = Date.now()

    const params = {
        TableName: tableUrlsPH,
        Key: {
            "UserID": userID,
            "PHID": PHID
        },
        ConditionExpression: "PHID = :PHID",
        UpdateExpression: "set #UpdateTS=:UpdateTS, ProcState=:ProcState",
        ExpressionAttributeValues: {
            ":UpdateTS": updateTS,
            ":ProcState": procState,

            ":PHID" : PHID
        },
        // just not to be empty
        ExpressionAttributeNames: {
            "#UpdateTS": "UpdateTS",
        },
        ReturnValues: "UPDATED_NEW"
    };

    if (procState == "downloaded") { 
        params.UpdateExpression += ", Dl_TS=:UpdateTS"

        params.ExpressionAttributeNames["#DL_size"] = "DL_size"
        params.ExpressionAttributeValues[":DL_size"] = data.size
        params.UpdateExpression += ", #DL_size=:DL_size"
    }
    else if (procState == "dl_queued") {
        params.UpdateExpression += ", Q_TS=:UpdateTS"
    }
    else if (procState == "processed") {
        params.UpdateExpression += ", Proc_TS=:UpdateTS"
    }
    else if (procState == "idle") {
        params.UpdateExpression += ", Proc_TS=:UpdateTS"
        params.ExpressionAttributeNames["#DLRetryCnt"] = "DLRetryCnt"
        params.ExpressionAttributeValues[":DLRetryCnt"] = 0
        params.UpdateExpression += ", #DLRetryCnt=:DLRetryCnt"
    }

    ddb_docclient.update(params, function (err, data) {
        if (err) {
            //console.log(err)
            logger.error("updateUrlPH_procState Unable to put item. Error:", JSON.stringify(err))
            callback(err, null)
        }
        else {
            //logger.info("updateUrlPH_procState put item OK:", JSON.stringify(params.Item))
            callback(err, params.Item)
        }
    })
}

//updateUrlPH_incDLRetryCount('x0', "1083953114", function (err, res) { console.log(err) } )
exports.updateUrlPH_incDLRetryCount = updateUrlPH_incDLRetryCount
function updateUrlPH_incDLRetryCount(userID, PHID, callback) {
    logger.info('addUrlPH')

    const params = {
        TableName: tableUrlsPH,
        Key: {
            "UserID": userID,
            "PHID": PHID
        },
        ConditionExpression: "PHID = :PHID",
        UpdateExpression: "set DLRetryCnt = DLRetryCnt + :one",
        ExpressionAttributeValues: {
            ":one": 1,
            ":PHID" : PHID
        },
        ReturnValues: "UPDATED_NEW"
    };

    ddb_docclient.update(params, function (err, data) {
        if (err) {
            logger.error("updateUrlPH_incDLRetryCount Unable to put item. Error:", JSON.stringify(err))
            callback(err, null)
        }
        else {
            logger.info("updateUrlPH_incDLRetryCount put item OK:", JSON.stringify(params.Item))
            //console.log(data)
            callback(err,  data.Attributes.DLRetryCnt)
        }
    })
}

//////////////////////////////
// DETs

exports.get_dets = get_dets
//get_dets("", "foo", function (err, data) { });
function get_dets(userID, callback) {
    logger.info('get_dets');
    logger.info(userID);

    const params = {
        TableName: tableDetections,
        KeyConditionExpression: "#UserID = :UserID",
        ExpressionAttributeNames: {
            "#UserID": "UserID"
        },
        ExpressionAttributeValues: {
            ":UserID": userID
        }
    }

    let results = { "Items" : [] };

    function on_query(err, data) {
        if (err) {
            logger.error("get_dets Unable to query item. Error:", JSON.stringify(err));
            callback(err, results)
        } else {
            //logger.info("get_dets OK:", JSON.stringify(data));
            results["Items"] = results["Items"].concat(data.Items)
            console.log(results["Items"].length)

            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("query for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                ddb_docclient.query(params, on_query)
            }
            else {
                callback(err, results)
            }
        }
    }

    ddb_docclient.query(params, on_query)
    
    /*
    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("get_dets Unable to query item. Error: " + JSON.stringify(err))
        } else {
            //logger.info("get_dets query OK: " + JSON.stringify(data))
        }

        callback(err, data);
    })
    */
}

exports.get_dets_limit = get_dets_limit
function get_dets_limit(userID, limit, startKey, callback) {
    logger.info('get_dets_limit');
    logger.info(userID);

    const params = {
        TableName: tableDetections,
        KeyConditionExpression: "#UserID = :UserID",
        ExpressionAttributeNames: {
            "#UserID": "UserID"
        },
        ExpressionAttributeValues: {
            ":UserID": userID
        }
    }

    if (limit > 0) params.Limit = limit
    if (startKey != null) params.ExclusiveStartKey = startKey

    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("get_dets_limit Unable to query item. Error: " + JSON.stringify(err))
        } else {
            //logger.info("get_dets_limit query OK: " + JSON.stringify(data))
        }

        callback(err, data);
    })
}

exports.remove_det = remove_det;
function remove_det(userID, data, callback) {
    logger.info('remove_job');
    logger.info(data.detID);

    const params = {
        TableName: tableDetections,
        Key: {
            "UserID": userID,
            "DetID": data.detID
        }
    }

    ddb_docclient.delete(params, function (err, del_data) {
        if (err) {
            logger.error("remove_det Unable to remove item. Error:" + JSON.stringify(err))
        } else {
            logger.info("remove_det remove OK:" + JSON.stringify(del_data))
        }

        callback(err, del_data)
    })
}

function update_det_state(userID, detID, state, callback) {
    const updateTS = Date.now();
    const params = {
        TableName: tableDetections,
        Key: {
            "UserID": userID,
            "DetID": detID
        },
        UpdateExpression: "set Accept_status=:Accept_status",
        ExpressionAttributeValues: {
            ":Accept_status": state
        },
        ReturnValues: "ALL_NEW"
    }

    ddb_docclient.update(params, function (err, data) {
        if (err) {
            logger.error("update_det_state Unable to update item. Error:" + JSON.stringify(err))
        }
        else {
            logger.info("update_det_state update OK: " + JSON.stringify(data))
        }

        callback(err, data)
    })
}

exports.accept_det = accept_det;
function accept_det(userID, data, callback) {
    logger.info('accept_det');
    logger.info(data.detID);

    update_det_state(userID, data.detID, 'accepted', function (err, data) {
        callback(err, data)
    })
}

exports.reject_det = reject_det;
function reject_det(userID, data, callback) {
    logger.info('reject_det')
    logger.info(data.detID)

    update_det_state(userID, data.detID, 'rejected', function (err, data) {
        callback(err, data)
    })
}

/*
|USERID |ID     |FEED_TITLE |TRACK_TITLE  |ANALIZED_CHUNK_LOC |TRACK_LOC  |ANALIZED_CHUNK_ABS_TS |BEGIN_SHIFT  |END_SHIFT |TYPE |WARNINGS |QUANTS                             |
|U0     ||DET0  |88FM       |vsjo chotko  |00100.ts           |chotko.mp3 |1000000               |20           |40        |FULL |end-cut  |3_4_0_0,595000,86#3_4_0_3,595500,91|
*/
exports.add_detection = add_detection;
function add_detection(user_id,
    det_id,
    feed_title, // dummy not used
    track_title,
    analized_chunk_loc, // id
    track_loc,
    analized_chunk_abs_ts,
    begin_shift,
    end_shift,
    type,
    warnings,
    quants,
    accept_status,
    callback) {
    logger.info('add_detection');

    let KWs = "empty"
    const createTS = Date.now();

    getUrlPH(user_id, analized_chunk_loc, function (err, data) {
        if (err) {
            logger.error("getUrlPH Unable to get item. Error:" + JSON.stringify(err))
        }
        else {
            // update lov with URL
            analized_chunk_loc = data.Items[0].Path
            feed_title = data.Items[0].Tube
            KWs = data.Items[0].KWs
        }

        const params = {
            TableName: tableDetections,
            Item: {
                "UserID": user_id,
                "DetID": det_id, //"DET" + shortid.generate(),
                "CreateTS": createTS,
                "Feed_title": feed_title,
                "Track_title": track_title,
                "Analized_chunk_loc": analized_chunk_loc,
                "Track_loc": track_loc,
                "Analized_chunk_TS": (analized_chunk_abs_ts != 0) ? analized_chunk_abs_ts : createTS,
                "Begin_shift": begin_shift, //Ex. reason of failure
                "End_shift": end_shift,
                "Type": type,
                "Warnings": warnings,
                "Quants": quants,
                "KWs": KWs,
                "Accept_status": accept_status //(type == "FULL") ? "auto_accepted" : "await"
            },
            ConditionExpression: "#DetID <> :DetID",
            ExpressionAttributeNames: { 
                "#DetID" : "DetID" 
            },
            ExpressionAttributeValues: {
                ":DetID" : det_id
            }
        }

        ddb_docclient.put(params, function (err, data) {
            if (err) {
                logger.error("add_detection Unable to put item. Error: " + JSON.stringify(err))
            }
            else {
                logger.info("add_detection put item OK: " + JSON.stringify(data))
            }

            callback(err, data)
        })
    })
}

//////////////////////////////////////////
// TUBES

exports.queryTubes = queryTubes
function queryTubes(userID, callback) {
    logger.info('queryTubes');

    const params = {
        TableName: tableTubes,
        KeyConditionExpression: "#UserID = :UserID",
        ExpressionAttributeNames: {
            "#UserID": "UserID"
        },
        ExpressionAttributeValues: {
            ":UserID": userID
        }
    };

    ddb_docclient.query(params, function (err, data) {
        if (err) {
            logger.error("queryKW Unable to query item. Error:", JSON.stringify(err));
        } else {
            logger.info("queryKW OK:", JSON.stringify(data));
        }

        callback(err, data);
    });
}


//createTables()
function createTables() {
    const params = {
        TableName: tableMarkers,
        KeySchema: [{
            AttributeName: "UserID",
            KeyType: "HASH"
        }, //Partition key
        {
            AttributeName: "Marker",
            KeyType: "RANGE"
        } //Sort key
        ],
        AttributeDefinitions: [{
            AttributeName: "UserID",
            AttributeType: "S"
        }, {
            AttributeName: "Marker",
            AttributeType: "S"
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }

    ddb.createTable(params, function (err, data) {
        if (err) {
            if (err.code === "ResourceInUseException" && err.message === "Cannot create preexisting table") {
                logger.info("Exception msg: " + err.message)
            }
            else {
                logger.error("Unable to create table. Error: " + JSON.stringify(err, null, 2))
            }
        }
        else {
            logger.info("Created table. Table description: " + JSON.stringify(data, null, 2))
        }
    })

    // Tubes
/*
    const params = {
            TableName: tableTubes,
            KeySchema: [{
                AttributeName: "UserID",
                KeyType: "HASH"
            }, //Partition key
            {
                AttributeName: "Tube",
                KeyType: "RANGE"
            } //Sort key
            ],
            AttributeDefinitions: [{
                AttributeName: "UserID",
                AttributeType: "S"
            }, {
                AttributeName: "Tube",
                AttributeType: "S"
            }],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        }
    
    ddb.createTable(params, function (err, data) {
            if (err) {
                if (err.code === "ResourceInUseException" && err.message === "Cannot create preexisting table") {
                    logger.info("Exception msg: " + err.message)
                }
                else {
                    logger.error("Unable to create table. Error: " + JSON.stringify(err, null, 2))
                }
            }
            else {
                logger.info("Created table. Table description: " + JSON.stringify(data, null, 2))
            }
    })
*/
    
/*
    // Urls
    const params = {
        TableName: tableUrlsPH,
        KeySchema: [{
            AttributeName: "UserID",
            KeyType: "HASH"
        }, //Partition key
        {
            AttributeName: "PHID",
            KeyType: "RANGE"
        } //Sort key
        ],
        AttributeDefinitions: [{
            AttributeName: "UserID",
            AttributeType: "S"
        }, {
            AttributeName: "PHID",
            AttributeType: "S"
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }

    ddb.createTable(params, function (err, data) {
        if (err) {
            if (err.code === "ResourceInUseException" && err.message === "Cannot create preexisting table") {
                logger.info("Exception msg: " + err.message)
            }
            else {
                logger.error("Unable to create table. Error: " + JSON.stringify(err, null, 2))
            }
        }
        else {
            logger.info("Created table. Table description: " + JSON.stringify(data, null, 2))
        }
    })
    
    // Detections
    const params = {
            TableName: tableDetections,
            KeySchema: [{
                AttributeName: "UserID",
                KeyType: "HASH"
            }, //Partition key
            {
                AttributeName: "DetID",
                KeyType: "RANGE"
            } //Sort key
            ],
            AttributeDefinitions: [{
                AttributeName: "UserID",
                AttributeType: "S"
            }, {
                AttributeName: "DetID",
                AttributeType: "S"
            }],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
    }
    
    ddb.createTable(params, function (err, data) {
            if (err) {
                if (err.code === "ResourceInUseException" && err.message === "Cannot create preexisting table") {
                    logger.info("Exception msg: " + err.message);
                }
                else {
                    logger.error("Unable to create table. Error: " + JSON.stringify(err, null, 2));
                }
    
            }
            else {
                logger.info("Created table. Table description: " + JSON.stringify(data, null, 2));
            }
    })
    
    // KeyWords
    const params = {
        TableName: tableKeyWords,
        KeySchema: [{
            AttributeName: "UserID",
            KeyType: "HASH"
        }, //Partition key
        {
            AttributeName: "KW",
            KeyType: "RANGE"
        } //Sort key
        ],
        AttributeDefinitions: [{
            AttributeName: "UserID",
            AttributeType: "S"
        }, {
            AttributeName: "KW",
            AttributeType: "S"
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }

    ddb.createTable(params, function (err, data) {
        if (err) {
            if (err.code === "ResourceInUseException" && err.message === "Cannot create preexisting table") {
                logger.info("Exception msg: " + err.message);
            }
            else {
                logger.error("Unable to create table. Error: " + JSON.stringify(err, null, 2));
            }

        }
        else {
            logger.info("Created table. Table description: " + JSON.stringify(data, null, 2));
        }
    })
    
    // Config
    const params = {
        TableName: tableConfig,
        KeySchema: [{
            AttributeName: "UserID",
            KeyType: "HASH"
        }, //Partition key
        ],
        AttributeDefinitions: [{
            AttributeName: "UserID",
            AttributeType: "S"
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }
    
    ddb.createTable(params, function (err, data) {
        if (err) {
            if (err.code === "ResourceInUseException" && err.message === "Cannot create preexisting table") {
                logger.info("Exception msg: " + err.message);
            }
            else {
                logger.error("Unable to create table. Error: " + JSON.stringify(err, null, 2));
            }
        }
        else {
            logger.info("Created table. Table description: " + JSON.stringify(data, null, 2));
        }
    })
    */
}
