import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
//import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { GeoJson } from '../model/location';
import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class LocationService {

    constructor() {
        mapboxgl.accessToken = environment.mapboxAccessToken
    }


    getMarkers(): any {
        //return this.db.list('/markers')
        return {};
    }

    createMarker(data: GeoJson) {
        //return this.db.list('/markers')
        //    .push(data)
    }

    removeMarker($key: string) {
       // return this.db.object('/markers/' + $key).remove()
    }

}