import {environment} from '../../environments/environment';
import {CognitoUtil} from './cognito.service';
import * as S3 from 'aws-sdk/clients/s3';
import {Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {UploadFile} from 'ngx-uploader';
import {Observable,of} from 'rxjs';
/**
 * Created by Vladimir Budilov
 */
@Injectable()
export class S3Service {

    constructor(
        private cognitoUtil: CognitoUtil,
        private log: NGXLogger
    ) {
    }

    private getS3(): S3 {
        let clientParams: any = {
            region: environment.bucketRegion,
            apiVersion: '2006-03-01',
            //params: {
            //    Bucket: environment.bucketNamePrefix + '-docs'
            // }
        };
        if (environment.s3_endpoint) {
            clientParams.endpoint = environment.s3_endpoint;
        }
        let s3 = new S3(clientParams);

        return s3
    }

    public addDoc(selectedFile: UploadFile, content, id: string): boolean {
        if (!selectedFile) {
            console.log('Please choose a file to upload first.');
            return;
        }
        let fileName = selectedFile.name; //selectedFile.name;
        let docKey = 'places/' + id + '/' + fileName;
        let nativeFile = selectedFile.nativeFile;
        // require('fs').createReadStream
        const reader = new FileReader();
        this.getS3().upload({
            Key: docKey,
            ContentType: selectedFile.type,
            Body: content,
            StorageClass: 'STANDARD',
            ACL: 'private',
            Bucket: environment.bucketNamePrefix + '-docs'
        }, (err, data) => {
            if (err) {
                this.log.error('There was an error uploading your doc: ', err);
                return false;
            }
            // data looks like {"ETag":"\"50b401b8605ee77ada5e87135f57156a\"","Location":
            // "https://yummy-docs.s3.eu-central-1.amazonaws.com/location/hase777.txt","key":
            // "location/hase777.txt","Key":"location/hase777.txt","Bucket":"yummy-docs"}
            this.log.info('Successfully uploaded doc of type' + selectedFile.type + ' key ' + docKey);
            return true;
        });
    }

    public deletePhoto(id: string) {
        // this.getS3().deleteObjectStore('').promise().then(function () {
        //
        // }
        /*
        this.getS3().deleteObject({Key: photoKey}, function (err, data) {
            if (err) {
                this.log.error('There was an error deleting your photo: ', err.message);
                return;
            }
            console.log('Successfully deleted photo.');
        });
        */
    }

    // READ Angular https://grokonez.com/aws/angular-4-amazon-s3-example-get-list-files-from-s3-bucket
    // {"IsTruncated":false,"Marker":"","Contents":[{"Key":"places/5c25517b-a351-4dbc-8fcb-f00d1f0065a4/kubernetes_linuxacademy-kubernetesadmin-archdiagrams-1_1516737832.pdf","LastModified":"2018-09-29T22:56:59.000Z","ETag":"\"9eadb0fb08d6c66f8edca48f655e7952\"","Size":189512,"StorageClass":"STANDARD"},{"Key":"places/5c25517b-a351-4dbc-8fcb-f00d1f0065a4/marker32.png","LastModified":"2018-09-29T22:44:24.000Z","ETag":"\"bc492ecc6d2d7a51fa1ff778ec34c587\"","Size":4104,"StorageClass":"STANDARD"}],"Name":"yummy-docs","Prefix":"places/5c25517b-a351-4dbc-8fcb-f00d1f0065a4/","Delimiter":"/","MaxKeys":1000,"CommonPrefixes":[]}
    public viewDocs(id: string): Observable<Array<any>> {
        const doclist = new Array<any>();
        const prefix = 'places/'+id+'/';
        //var albumPhotosKey = encodeURIComponent('hase') + '//';
        this.log.info('Listing in bucket ' + 'places/' + id);
        this.getS3().listObjects({
            Prefix: prefix,
            Delimiter: '/',
            Bucket: environment.bucketNamePrefix + '-docs'
            },  (err, data) => {
            if (err) {
                this.log.error('There was an error viewing your album: ' + err);
            }
            // this.log.info(JSON.stringify(data));
            const fileData = data.Contents;
            fileData.forEach( (file) => {
                // fileUploads appends file...
                doclist.push( {
                    'name': file.Key.substr(prefix.length),
                    'size': Math.round(file.Size / 1024) + 'kb',
                    'updatedAt': file.LastModified.toISOString(),
                    'url': this.getS3().getSignedUrl('getObject',{Bucket: environment.bucketNamePrefix + '-docs', Key: file.Key})
                });
            })
        });
        return of(doclist);
    }

}