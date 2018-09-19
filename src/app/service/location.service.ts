import {Injectable} from '@angular/core';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {NGXLogger} from 'ngx-logger';
import {DocumentClient, ScanInput} from 'aws-sdk/clients/dynamodb';
import {AWSError} from 'aws-sdk/global';
import {CognitoUtil} from './cognito.service';
import {DynamoDBUtil} from './ddb.service';
import { Location } from '../model/location';
import {environment} from '../../environments/environment';

// import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { GeoJson } from '../model/location';
// import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class LocationService {

    constructor(
        private cognitoUtil: CognitoUtil,
        private ddbUtil: DynamoDBUtil,
        private log: NGXLogger
    ) {
        // mapboxgl.accessToken = environment.mapboxAccessToken
    }

    getAll() {
        return this.ddbUtil.getMapper().scan({valueConstructor: Location, projection: ['code', 'name', 'region', 'coordinates']});
    }

    getMarkers(): any {
        // return this.db.list('/markers')
        return {};
    }

    createMarker(data: GeoJson) {
        // return this.db.list('/markers')
        //    .push(data)
    }

    removeMarker($key: string) {
       // return this.db.object('/markers/' + $key).remove()
    }

}