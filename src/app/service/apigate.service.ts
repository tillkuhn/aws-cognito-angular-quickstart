import { Injectable } from '@angular/core';
import {CognitoUtil} from './cognito.service';
import {NGXLogger} from 'ngx-logger';
import * as AWS from 'aws-sdk/global';
import {environment} from '../../environments/environment';
import {HttpClient,HttpHeaders  } from '@angular/common/http';
import {Observable,of} from 'rxjs';
import {Region} from '../model/location';

declare let apigClientFactory: any;

@Injectable({
  providedIn: 'root'
})
export class ApigateService {

    constructor(
        public cognitoUtil: CognitoUtil,
        private log: NGXLogger,
        private http: HttpClient

    ) {}

    getRegions(): Promise<Array<Region>>  {
        // see also https://github.com/aws-samples/aws-cognito-apigw-angular-auth/blob/master/src/app/aws.service.ts
        return new Promise((resolveList, reject) => {
            this.cognitoUtil.getIdAsJWT().then( (resolve) => {
                const headers = new HttpHeaders({
                    'Authorization': resolve // Bearer prefix not necessary
                });
                //this.log.info(resolve);
                this.http.get( environment.apiGatewayInvokeUrl + '/regions',{headers: headers}).subscribe(data => {
                    //console.log(data);
                    resolveList(data as Array<Region>);
                });

            });
        });
    }

    //this.http.put(this.endpoint + '/regions',{ "code": "at",name: "Oeschis"},{headers: headers}).subscribe(data => {
    //    console.log(data);
    //});
}

