import {environment} from '../../environments/environment';
import {CognitoUtil} from './cognito.service';
import * as AWS from 'aws-sdk/global';
import * as S3 from 'aws-sdk/clients/s3';
import {Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';

/**
 * Created by Vladimir Budilov
 */
@Injectable()
export class S3Service {

    constructor(
        private cognitoUtil: CognitoUtil,
        private log: NGXLogger
    ) {}

    private getS3(): any {
        /*
        AWS.config.update({
            region: environment.bucketRegion,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: environment.identityPoolId
            })
        });
        */

        let clientParams:any = {
            region: environment.bucketRegion,
            apiVersion: '2006-03-01',
            params: {Bucket: environment.bucketNamePrefix + '-docs'}
        };
        if (environment.s3_endpoint) {
            clientParams.endpoint = environment.s3_endpoint;
        }
        var s3 = new S3(clientParams);

        return s3
    }

    public addDoc(selectedFile): boolean {
        if (!selectedFile) {
            console.log('Please choose a file to upload first.');
            return;
        }
        let fileName = selectedFile; //selectedFile.name;
        let docKey = 'location/' + fileName;

        this.getS3().upload({
            Key: docKey,
            ContentType: 'text/plain', //selectedFile.type,
            Body: 'hase',// selectedFile,
            StorageClass: 'STANDARD',
            ACL: 'private'
        },  (err, data) => {
            if (err) {
                this.log.error('There was an error uploading your doc: ', err);
                return false;
            }
            // data looks like {"ETag":"\"50b401b8605ee77ada5e87135f57156a\"","Location":"https://yummy-docs.s3.eu-central-1.amazonaws.com/location/hase777.txt","key":"location/hase777.txt","Key":"location/hase777.txt","Bucket":"yummy-docs"}
            this.log.info('Successfully uploaded doc.');
            return true;
        });
    }

    public deletePhoto(albumName, photoKey) {
        // this.getS3().deleteObjectStore('').promise().then(function () {
        //
        // }
        this.getS3().deleteObject({Key: photoKey}, function (err, data) {
            if (err) {
                this.log.error('There was an error deleting your photo: ', err.message);
                return;
            }
            console.log('Successfully deleted photo.');
        });
    }

    public viewAlbum(albumName) {
        var albumPhotosKey = encodeURIComponent('hase') + '//';
        this.getS3().listObjects({Prefix: albumPhotosKey}, function (err, data) {
            if (err) {
                console.log('There was an error viewing your album: ' + err);
            }

        });
    }

}