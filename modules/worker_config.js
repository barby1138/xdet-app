module.exports = Object.freeze({
    // GENERIC
    USER_ID: 'x0',
    //S3_BUCKET: 'xdet'

    // DET PROC
    DATA_FOLDER: '/home/tsis/data_test',
    DET_MAX_INFLY_THSHLD: 80 * 3,
    DET_Q_NAME: "xdet_Q_det_my",

    //DL CALLER
    DL_CALLER_Q_MAX_THSHLD: 400, //300,
    DL_CALLER_Q_MIN_THSHLD: 200, //100,
    CALLDLQ_TO_MSEC: 10 * 60 * 1000,

    //DL SOURCE
    DL_MAX_RETRIES: 3,
    DL_MAX_CNT: 20,
    DL_Q_MIN_THSHLD: 400,
    COMMON_POLL_TO_MSEC: 5000,
    ARCH_PATH: '/home/tsis/data_test/archive/x0/PH'

});