var AWS = require('aws-sdk');
var https = require('https');
var s3 = new AWS.S3();


exports.handler = function(event, context) {

    const targetBucket = process.env.TARGET_BUCKET;
    //var url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/AmazonWebservices_Logo.svg/500px-AmazonWebservices_Logo.svg.png';
    var url = event.url;
    var targetKey = event.targetKey;

    https.get(url, function(res) {
        console.log("Downloading " + url + " to " + targetBucket + "/" + targetKey);
        res.setEncoding('binary');
        var body = '';
        res.on('data', function(chunk) {
            // Agregates chunks
            body += chunk;
        });
        res.on('end', function() {
            // Once you received all chunks, send to S3
            var params = {
                Bucket: targetBucket,
                Key: targetKey,
                Body: new Buffer(body, 'binary'),
            };
            s3.putObject(params, function(err, data) {
                if (err) {
                    console.error(err, err.stack);
                } else {
                    console.log(data);
                }
                context.done(null, 'Finished UploadObjectOnS3');
            });
        });
    });
};