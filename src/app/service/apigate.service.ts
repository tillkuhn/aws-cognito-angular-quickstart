import { Injectable } from '@angular/core';
import {CognitoUtil} from './cognito.service';
import {NGXLogger} from 'ngx-logger';
import * as AWS from 'aws-sdk/global';
import {environment} from '../../environments/environment';
import {HttpClient,HttpHeaders  } from '@angular/common/http';
import {IdTokenCallback} from '../secure/jwttokens/jwt.component';
declare let apigClientFactory: any;

@Injectable({
  providedIn: 'root'
})
export class ApigateService {

    endpoint: string;

    constructor(
        public cognitoUtil: CognitoUtil,
        private log: NGXLogger,
        private http: HttpClient

    ) {
        this.endpoint = environment.apiGatewayInvokeUrl;

    }


    getKlaus(): void {
        // see also https://github.com/aws-samples/aws-cognito-apigw-angular-auth/blob/master/src/app/aws.service.ts
        this.cognitoUtil.getIdAsJWT().then( (resolve) => {
            const headers = new HttpHeaders({
                'Content-Type':'application/json; charset=utf-8',
                'Authorization': resolve // Bearer prefix not necessary
            });
            this.log.info(resolve);
            this.http.get(this.endpoint + '/regions',{headers: headers}).subscribe(data => {
                console.log(data);
            });
            this.http.put(this.endpoint + '/regions',{ "code": "at",name: "Oeschis"},{headers: headers}).subscribe(data => {
                console.log(data);
            });
        });
    }
}
