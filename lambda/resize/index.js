// see also https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html
// dependencies
const AWS = require('aws-sdk');
const gm = require('gm').subClass({imageMagick: true}); // Enable ImageMagick integration.
const util = require('util');
const Promise = require('bluebird');
Promise.promisifyAll(gm.prototype);

// constants yeah
const MAX_WIDTH = process.env.MAX_WIDTH ? process.env.MAX_WIDTH : 250;
const MAX_HEIGHT = process.env.MAX_HEIGHT ? process.env.MAX_HEIGHT : 250;

const thumbnailBucket = process.env.THUMBNAIL_BUCKET;
const thumbnailPrefix = process.env.THUMBNAIL_PREFIX ? process.env.THUMBNAIL_PREFIX : "resized-";

// get reference to S3 client
const s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
    console.log("Reading input from event:\n", util.inspect(event, {depth: 5}));
    // get the object from S3 first
    const s3Bucket = event.Records[0].s3.bucket.name; // event.s3Bucket;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKeyOrig = event.Records[0].s3.object.key;
    const srcKey = decodeURIComponent(srcKeyOrig.replace(/\+/g, " "));
    const getObjectPromise = s3.getObject({
        Bucket: s3Bucket,
        Key: srcKey
    }).promise();

    // identify image metadata
    const identifyPromise = new Promise(resolve => {
        getObjectPromise.then(getObjectResponse => {
            console.log("success downloading from s3.");
            gm(getObjectResponse.Body).identifyAsync().then(data => {
                console.log("Identified metadata:\n", util.inspect(data, {depth: 5}));
                resolve(data)
            }).catch(err => {
                callback(err);
            });
        }).catch(err => {
            callback(err);
        });
    });


    // resize the image
    var resizePromise = new Promise((resolve) => {
        getObjectPromise.then((getObjectResponse) => {
            identifyPromise.then(identified => {
                const size = identified.size;
                const scalingFactor = Math.min(
                    MAX_WIDTH / size.width,
                    MAX_HEIGHT / size.height
                );
                const width = scalingFactor * size.width;
                const height = scalingFactor * size.height;
                gm(getObjectResponse.Body).resize(width, height).toBuffer(identified.format, (err, buffer) => {
                    if (err) {
                        console.error("failure resizing to " + width + " x " + height);
                        callback(err);
                    } else {
                        console.log("success resizing to " + width + " x " + height);
                        resolve(buffer);
                    }
                });
            }).catch(err => callback(err));

        }).catch(function (err) {
            callback(err);
        });
    })

    // upload the result image back to s3
    const destKey = thumbnailPrefix + srcKey;

    resizePromise.then(buffer => {
        identifyPromise.then(identified => {
            const s3PutParams = {
                Bucket: thumbnailBucket,
                Key: destKey,
                ContentType: "image/" + identified.format.toLowerCase()
            };

            s3PutParams.Body = buffer;
            s3.upload(s3PutParams).promise().then(data => {
                delete s3PutParams.Body;
                console.log("success uploading to s3:\n ", s3PutParams);
                var thumbnailImage = {};
                thumbnailImage.s3key = destKey;
                thumbnailImage.s3bucket = thumbnailBucket;
                callback(null, {'thumbnail': thumbnailImage});
            }).catch(function (err) {
                delete s3PutParams.Body;
                console.error("failure uploading to s3:\n ", s3PutParams);
                callback(err);
            })
        }).catch(err => {
            callback(err)
        });
    }).catch(function (err) {
        callback(err);
    })
}