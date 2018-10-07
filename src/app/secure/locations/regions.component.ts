import {Component, OnInit} from '@angular/core';
import {LocationService} from '../../service/location.service';
import {Location, Region, GeoJson, FeatureCollection} from '../../model/location';
import {ApigateService} from '../../service/apigate.service';
import {NgProgress} from '@ngx-progressbar/core';
import {Router} from '@angular/router';
import {CacheService} from '@ngx-cache/core';
import {ToastrService} from 'ngx-toastr';
import {NGXLogger} from 'ngx-logger';


@Component({
    selector: 'app-regions',
    templateUrl: './regions.component.html',
    styleUrls: []
})
export class RegionsComponent implements OnInit {


    debug: boolean = true;
    regions: Array<Region>;
    newRegion: Region;

    constructor(
        private locationService: LocationService,
        private progress: NgProgress,
        private readonly cache: CacheService,
        private router: Router,
        private toastr: ToastrService,
        private log: NGXLogger
    ) {
    }

    ngOnInit() {
        this.log.info('ngOnInit');
        this.newRegion = new Region();
        this.onRefresh();
    }

    onRefresh(): void {
        this.locationService.getRegions().then( (data) => {
            this.log.info("Received");
            this.regions = data;
        })

    }

    onSubmitRegion(): void {
        this.log.info("Submitting new region");
        this.locationService.putRegion(this.newRegion).then( (data) => {
            this.toastr.info('New Region saved ' + JSON.stringify(data) );
        })
    }


}