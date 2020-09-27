const logger = require('./logger')('STRG');

const path_module = require('path');
const PB = require('progress');
const fs = require('fs');
const targz = require('targz');

const AWS = require('aws-sdk');
AWS.config.loadFromPath('./modules/awsConfig.js');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

//exports.EXT_STORAGE_PREFIX = EXT_STORAGE_PREFIX;
//const EXT_STORAGE_PREFIX = 'https://s3.eu-west-2.amazonaws.com/onairear';

// TODO handle no such file, etc.
//test_untar("tools/data/fp/TRCKBJO7JPKfz.fp.tar.gz");
//download_file("fp/TRCKrkBuIGxZz.fp.tar.gz");
/*
function test_untar(output) {
	targz.decompress({
		src: output,
		dest: 'tools/data/fp'
	}, (err) => {
		if (err) {
			logger.error(err);
		} else {
			logger.info("Done!");
		}
	});
}

function download_file(filename) {
	return new Promise((resolve, reject) => {
		const output = "tools/data/" + filename;
		const stream = fs.createWriteStream(output);
		const params = {
			Bucket: "onairear",
			Key: filename
		};
		let bar;
		s3.getObject(params)
			.on('httpHeaders', (statusCode, headers, resp) => {
				var len = parseInt(headers['content-length'], 10);

				bar = new PB('  ' + filename + ': [:bar] :percent :etas', {
					complete: '=',
					incomplete: ' ',
					width: 20,
					total: 10//len
				});

			})
			.on('httpData', (chunk) => {
				stream.write(chunk);
				bar.tick(chunk.length);
			})
			.on('httpDone', (response) => {
				if (response.error) {
					reject(response.error);
				} else {
					resolve(output);
				}
				stream.end();
			})
			.send();
	});
}
*/
//upload_file(fs.createReadStream('/media/tsis/UBUNTU 16_0/onair@/web_worker/tools/00048_JOBBJe6R8mjz.ts'), 'onairear/det')
// from doc: Body — (Buffer, Typed Array, Blob, String, ReadableStream) Object data.
exports.upload_file = upload_file;
function upload_file(data, bucket, key) {
	return new Promise((resolve, reject) => {
		logger.info('uploading to ' + bucket + ' ' + key);
		const params = { Bucket: bucket, Key: key, Body: data};
		//const options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
		const options = { };
		s3.upload(params, options, function (err, data) {
			if (err) {
				logger.error('upload_file ERROR:' + JSON.stringify(err));
				reject(err);
			}
			else {
				logger.info('upload_file OK:' + JSON.stringify(data));
				resolve(data);
			}
		});
	});
}

exports.download_file = download_file
function download_file(key, bucket, dest_file) {
	return new Promise((resolve, reject) => {
		const output = dest_file
		const stream = fs.createWriteStream(output)
		const params = {
			Bucket: bucket,
			Key: key
		};
		let bar
		s3.getObject(params)
			.on('httpHeaders', (statusCode, headers, resp) => {
				var len = parseInt(headers['content-length'], 10)

				bar = new PB('  ' + dest_file + ': [:bar] :percent :etas', {
					complete: '=',
					incomplete: ' ',
					width: 20,
					total: 10//len
				})
			})
			.on('httpData', (chunk) => {
				stream.write(chunk)
				//bar.tick(chunk.length)
			})
			.on('httpDone', (response) => {
				stream.end(() => {
					if (response.error) {
						logger.error("httpDone error " + response.error);
						reject(response.error);
					} else {
						resolve(response);
					}
				})
			})
			.send()
	})
}

function download_and_untar_file(key, bucket, dest_file) {
	return new Promise((resolve, reject) => {
		const output = dest_file //dest_dir + "/" + filename;
		const stream = fs.createWriteStream(output);
		const params = {
			Bucket: bucket,
			Key: key
		};
		let bar;
		s3.getObject(params)
			.on('httpHeaders', (statusCode, headers, resp) => {
				var len = parseInt(headers['content-length'], 10);

				bar = new PB('  ' + dest_file + ': [:bar] :percent :etas', {
					complete: '=',
					incomplete: ' ',
					width: 20,
					total: 10//len
				});

			})
			.on('httpData', (chunk) => {
				stream.write(chunk);
				bar.tick(chunk.length);
			})
			.on('httpDone', (response) => {
				stream.end(() => {
					if (response.error) {
						logger.error("httpDone error " + response.error);
						reject(response.error);
					} else {
						//console.log("httpDone OK - untar " + output);
						// untasr
						const dest_dir = path_module.dirname(dest_file)
						targz.decompress({ src: output, dest: dest_dir }, (err) => {
							if (err) {
								logger.error("untar failed " + err);
								resolve(err) //reject(err);
							} else {
								logger.debug("untar OK" + output);
								resolve(output);
							}
						});
					}
				});
			})
			.send();
	});
}

exports.get_and_untar_files = get_and_untar_files;
function get_and_untar_files(files, bucket, dest_dir) {
	return Promise.all(files.map((key) => { 
		const file_name = path_module.basename(key)
		return download_and_untar_file(key, bucket, dest_dir + '/' + file_name); 
	}));
}

exports.list_objects = list_objects
function list_objects(bucket, prefix) {
	return new Promise((resolve, reject) => {
		// TODO if is truncated repeat request with marker == last returned key
		var params = {
		Bucket: bucket, /* required */
		//Delimiter: 'STRING_VALUE',
		//EncodingType: url,
		//Marker: 'STRING_VALUE',
		//MaxKeys: 0,
		Prefix: prefix,
		//RequestPayer: requester
  		}
  		s3.listObjects(params, function(err, data) {
			if (err) {
				//console.log(err, err.stack) // an error occurred
				reject(err)
			}
			else {
				//console.log(data) 
				const keys = data.Contents.filter(x => x.Size != 0 ).map(x => x.Key) // => { return x.Key })
				//console.log(keys) 
				resolve(keys)
			}
  		})
	})
}

// *********** --------------------- *********** //
// *********** example usage: app.js *********** //
// *********** --------------------- *********** //
// #!/usr/bin/env node

// var Q = require('q'),
// fileAPI = require('./file'),
// filenames = [
// 	'files/one.pdf',
// 	'files/two.pdf',
// 	'files/three.ppt',
// 	'files/four.ppt'
// ];

// fileAPI.getFiles(filenames)
// .then(console.log)
// .fail(function (error) {
// 	console.error('Error: ' + error.statusCode + ' - ' + error.message);
// });
// *********** // example usage: app.js *********** //

// *********** -------------- *********** //
// *********** example output *********** //
// *********** -------------- *********** //
//  files/one.pdf: [===================] 100% 0.0s
//  files/two.pdf: [===================] 100% 0.0s
//  files/three.ppt: [===================] 100% 0.0s
//  conversions/four.ppt: [===================] 100% 0.0s
// *********** // example output *********** //