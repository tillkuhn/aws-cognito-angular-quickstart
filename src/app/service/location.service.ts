import {Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {CognitoUtil} from './cognito.service';
import {DynamoDBUtil} from './ddb.service';
import {Location, Region} from '../model/location';
import {environment} from '../../environments/environment';
import {GeoJson} from '../model/location';
import {COUNTRIES} from '../model/countries';
import {AWSError} from 'aws-sdk';
import {DocumentClient, ScanInput} from 'aws-sdk/clients/dynamodb';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {HttpClient, HttpHeaders} from '@angular/common/http';

// import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class LocationService {

    constructor(
        private cognitoUtil: CognitoUtil,
        private ddbUtil: DynamoDBUtil,
        private http: HttpClient,
        private log: NGXLogger
    ) {
    }

    getPlaces() {
        return this.ddbUtil.getMapper().scan({
            valueConstructor: Location,
            projection: ['id', 'country', 'summary', 'name', 'region', 'coordinates', 'rating']
        });
    }

    getPlace(id: string) {
        return this.ddbUtil.getMapper().get(Object.assign(new Location(), {id: id}));
    }

    /*
     * Get reduces PoI Locations for Map Display
     */
    getPois(callback: (err: AWSError, data: DocumentClient.ScanOutput) => void): void {
        let params: ScanInput  = {
            TableName: this.ddbUtil.getTableName('place'),
            ProjectionExpression: 'id,coordinates,#locationname',
            ExpressionAttributeNames: {'#locationname': 'name'}
        };
        let docClient = new DynamoDB.DocumentClient(this.ddbUtil.getClientParams());
        docClient.scan(params, callback);
    }

    save(item) { // put
        // const toSave = Object.assign(new MyDomainObject, {id: 'foo'});
        // update stamp
        if (!item.createdBy) {
            item.createdBy = this.cognitoUtil.getCurrentUser().getUsername();
        }
        item.updatedAt = new Date().toISOString();
        item.updatedBy = this.cognitoUtil.getCurrentUser().getUsername();
        return this.ddbUtil.getMapper().put(item);
    }

    delete(location: Location) {
        return this.ddbUtil.getMapper().delete(Object.assign(new Location(), {id: location.id}));
    }

    getMarkers(): any {
        // return this.db.list('/markers')
        return {};
    }

    getCountries(): Array<Location> {
        return COUNTRIES.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    }

    // Regions retrieved the "new" way thru API Gateway
    getRegions(): Promise<Array<Region>>  {
        // see also https://github.com/aws-samples/aws-cognito-apigw-angular-auth/blob/master/src/app/aws.service.ts
        return new Promise((resolveGet, reject) => {
            this.cognitoUtil.getIdAsJWT().then( (resolve) => {
                const headers = new HttpHeaders({
                    'Authorization': resolve // Bearer prefix not necessary
                });
                //this.log.info(resolve);
                this.http.get( environment.apiGatewayInvokeUrl + '/regions',{headers: headers}).subscribe(data => {
                    //this.log.info(JSON.stringify(data));
                    resolveGet((data as Array<Region>).sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)));
                });

            });
        });
    }

    putRegion(region: Region): Promise<any> {
        return new Promise((resolvePut, reject) => {
            this.cognitoUtil.getIdAsJWT().then( (resolve) => {
                const headers = new HttpHeaders({
                    'Authorization': resolve // Bearer prefix not necessary
                });
                //this.log.info(resolve);
                this.http.put( environment.apiGatewayInvokeUrl + '/regions',region, {headers: headers}).subscribe(data => {
                    this.log.info('new region put to api gw');
                    resolvePut(data);
                });

            });
        });
    }


}