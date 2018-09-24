import {Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {CognitoUtil} from './cognito.service';
import {DynamoDBUtil} from './ddb.service';
import { Location } from '../model/location';
import {environment} from '../../environments/environment';
import { GeoJson } from '../model/location';
import {Dish} from '../model/dish';
// import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class LocationService {

    constructor(
        private cognitoUtil: CognitoUtil,
        private ddbUtil: DynamoDBUtil,
        private log: NGXLogger
    ) {}

    getAll() {
        return this.ddbUtil.getMapper().scan({valueConstructor: Location, projection: ['id', 'country', 'code', 'name', 'region', 'coordinates', 'rating']});
    }


    get(id: string) {
        return this.ddbUtil.getMapper().get(Object.assign(new Location(), {id: id}));
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

    createMarker(data: GeoJson) {
        // return this.db.list('/markers')
        //    .push(data)
    }

    removeMarker($key: string) {
       // return this.db.object('/markers/' + $key).remove()
    }

}