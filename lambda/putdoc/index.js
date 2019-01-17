var AWS = require('aws-sdk');
var https = require('https');
var s3 = new AWS.S3();


exports.handler = function(event, context, callback) {

    const targetBucket = process.env.TARGET_BUCKET;
    //var url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/AmazonWebservices_Logo.svg/500px-AmazonWebservices_Logo.svg.png';
    if ( ! event.body) {
        console.log("no event body");
    }
    let requestBody = JSON.parse(event.body)
    let url = requestBody.url;
    let targetKey = requestBody.targetKey;

    //console.log(JSON.stringify(event));
    console.log("Downloading " + url + " to " + targetBucket + "/" + targetKey);
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
                //context.done(null, 'Finished UploadObjectOnS3');
                // The output from a Lambda proxy integration must be
                // of the following JSON object. The 'headers' property
                // is for custom response headers in addition to standard
                // ones. The 'body' property  must be a JSON string. For
                // base64-encoded payload, you must also set the 'isBase64Encoded'
                // property to 'true'.

                var responseBody = {
                    message: "hurray it worked",
                    input: event
                };
                var response = {
                    statusCode: 200,
                    headers: {
                        "x-custom-header" : "my custom header value"
                    },
                    body: JSON.stringify(responseBody)
                };
                console.log("response: " + JSON.stringify(response))
                callback(null, response);
            });
        });
    });
};