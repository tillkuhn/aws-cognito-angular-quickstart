import {Component, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {LocationService} from '../../service/location.service';
import {Location, GeoJson, FeatureCollection} from '../../model/location';
import {ApigateService} from '../../service/apigate.service';
import {NgProgress} from '@ngx-progressbar/core';
import {Router} from '@angular/router';
import {CacheService} from '@ngx-cache/core';
import {ToastrService} from 'ngx-toastr';
import {NGXLogger} from 'ngx-logger';
import {Dish} from '../../model/dish';

@Component({
    selector: 'app-locations',
    templateUrl: './places.component.html',
    styleUrls: []
})
export class PlacesComponent implements OnInit {

    readonly cacheKeyLocations: string = 'locations'
    /// default settings
    map: mapboxgl.Map;
    style = 'mapbox://styles/mapbox/outdoors-v9';
    // lat = 37.75;lng = -122.41;
    message = 'Hello World!';

    locations: Array<Location> = [];
    selected: Array<Location> = [];
    debug: false;
    // data
    source: any;
    markers: any;

    constructor(
        private locationService: LocationService,
        private progress: NgProgress,
        private readonly cache: CacheService,
        private router: Router,
        private toastr: ToastrService,
        private apigate: ApigateService,
        private log: NGXLogger
    ) {
    }

    ngOnInit() {
        this.get();
        // this.initializeMap()
    }

    get(): void {

        if (this.cache.has(this.cacheKeyLocations)) {
            this.log.info('LocationsComponent: locations coming from cache ', this.cacheKeyLocations);
            this.locations = this.cache.get(this.cacheKeyLocations);
        } else {
            this.onRefresh();
        }
    }


    onRefresh(): void {
        this.progress.start();
        this.log.info('locations not cached loading start');
        this.load().then((resolve) => {
            this.locations = resolve;
            this.cache.set(this.cacheKeyLocations, resolve);
        }).finally(() => {
            this.log.info('LocationsComponent: Loading complete');
            this.progress.complete();
        });
    }

    async load(): Promise<Array<Location>> {
        // Async functions always return a promise, whether you use await or not. That promise resolves with whatever the async
        // function returns, or rejects with whatever the async function throws. So with:
        let result = new Array<Location>();
        for await (const item of this.locationService.getPlaces()) {
            result.push(item);
        }
        return result;
    }


    onSelect({selected}) {
        this.log.debug('Select Event', selected, this.selected);
        this.gotoDetail(selected[0]);
    }

    gotoDetail(item: Location): void {
        this.router.navigate(['/secure/places', item.id]);
    }

}