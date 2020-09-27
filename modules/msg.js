const logger = require('./logger')('MSG');

const AWS = require('aws-sdk');
AWS.config.loadFromPath('./modules/awsConfig.js');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

//const url = 'https://sqs.eu-west-2.amazonaws.com/452488610178/';

function get_Q(Q_name, callback) {
    var params = {
        QueueName: Q_name //'ear_Q_entity_' + 'E0'
    };

    sqs.getQueueUrl(params, function (err, data) {
        if (err) {
            logger.error("get_Q Error", err);
            // no q yet - first run
            if (err.code == "AWS.SimpleQueueService.NonExistentQueue") {
                logger.info("get_Q need to create Q");
                createQ(params.QueueName, function (err, data) {
                    callback(err, data);
                });
            }
        } else {
            logger.debug("get_Q OK:", data.QueueUrl);
        }

        callback(err, data);
    });
}

exports.get_msg_Q_massages_num = get_msg_Q_massages_num;
function get_msg_Q_massages_num(Q_name, callback) {

    function get_massages_num(Q_url, callback) {
        var params = {
            QueueUrl : Q_url,
            AttributeNames :['ApproximateNumberOfMessages']
        }
  
        sqs.getQueueAttributes(params, function(err, data){
            if (err) {
                logger.error("get_massages_num Error:", err);
            } else {
                logger.debug("get_massages_num OK:", data);
            }

            callback(err, data);
        })
    }

    get_Q(Q_name, function (err, data) {
        if (err) {
            callback(err, data);
        }
        else {
            get_massages_num(data.QueueUrl, function (err, data) {
                callback(err, (err) ? null : data.Attributes.ApproximateNumberOfMessages);
            });
        }
    });
}


exports.send_msg_Q = send_msg_Q;
function send_msg_Q(Q_name, msg_attr, callback) {

    function send_msg(Q_url, msg_attr, callback) {
        var params = {
            //DelaySeconds: 10,
            MessageAttributes: msg_attr,
            MessageBody: "Take me.",
            QueueUrl: Q_url
        };

        sqs.sendMessage(params, function (err, data) {
            if (err) {
                logger.error("send_msg Error:", err);
            } else {
                logger.debug("send_msg OK:", data.MessageId);
            }

            callback(err, data);
        });
    }

    get_Q(Q_name, function (err, data) {
        if (err) {
            callback(err, data);
        }
        else {
            send_msg(data.QueueUrl, msg_attr, function (err, data) {
                callback(err, data);
            });
        }
    });
}

exports.recv_msg_Q = recv_msg_Q;
function recv_msg_Q(Q_name, callback) {

    function recv_msg(Q_url, callback) {
        var params = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 10,
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: Q_url,
            //VisibilityTimeout: 60,
            //WaitTimeSeconds: 20
        };

        sqs.receiveMessage(params, function (err, data) {
            if (err) {
                logger.error("receiveMessage Error: ", err);
            }
            else {
                logger.debug("receiveMessage OK: ", data);
            }

            callback(err, data);
        });
    }

    get_Q(Q_name, function (err, data) {
        if (err) {
            callback(err, null);
        }
        else {
            var q_url = data.QueueUrl;
            recv_msg(q_url, function (err, data) {
                callback(err, data);
            });
        }
    });
}

exports.delete_msg = delete_msg;
function delete_msg(Q_name, msg, callback) {
    get_Q(Q_name, function (err, data) {
        if (err) {
            callback(err, null);
        }
        else {
            var q_url = data.QueueUrl;
            logger.debug("delete_msg ", q_url);

            var deleteParams = {
                QueueUrl: q_url,
                ReceiptHandle: msg.ReceiptHandle
            };

            sqs.deleteMessage(deleteParams, function (err, data) {
                if (err) {
                    logger.error("deleteMessage Error: ", err);
                } else {
                    logger.info("deleteMessage OK: ", data);
                }

                callback(err, data);
            });
        }
    });
}

exports.createQ = createQ;
function createQ(q_name, callback) {
    var params = {
        QueueName: q_name,
        Attributes: {
            'DelaySeconds': '60',
            'MessageRetentionPeriod': '86400'
        }
    };

    sqs.createQueue(params, function (err, data) {
        if (err) {
            logger.error("createQueue Error: ", err);
        } else {
            logger.info("createQueue OK: ", data.QueueUrl);
        }

        callback(err, data);
    });
}
