import {Component, Input, OnInit} from '@angular/core';
import {Location, LocationType} from '../../model/location';
import {LOCATIONS} from '../../model/mock-locations';
import {LocationService} from '../../service/location.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {NgProgress} from '@ngx-progressbar/core';
import {CacheService} from '@ngx-cache/core';
import {NGXLogger} from 'ngx-logger';
import {LoggedInCallback} from '../../service/cognito.service';

@Component({
  selector: 'app-location-detail',
  templateUrl: './location-detail.component.html',
  styleUrls: ['./location-detail.component.css']
})
export class LocationDetailComponent implements OnInit,LoggedInCallback {

    @Input() location: Location;

    //selectableTags: Array<LocationTag> = [];
    //selectedTags: Array<string> = [];
    countries: Array<Location> = LOCATIONS;

    lotypes =  LocationType;
    lotypeKeys: string[];

    error: any;
    debug: false;
    navigated = false; // true if navigated here

    constructor(
        private locationService: LocationService,
        private http: HttpClient,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private progress: NgProgress,
        private readonly cache: CacheService,
        private log: NGXLogger,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.lotypeKeys =  Object.keys(LocationType).filter(k => !isNaN(Number(k)));
        this.log.info(JSON.stringify( this.lotypeKeys ));
        this.route.params.forEach((params: Params) => {
            if (params['id'] !== undefined) {  // RESTful URL to existing ID?
                const id = params['id'];
                this.navigated = true;
                this.progress.start();
                this.locationService.get(id)
                    .then(locationItem => {
                        this.location = locationItem;
                        if (! this.location.coordinates) {
                            this.location.coordinates = new Array<number>(2);
                        }
                        // the item was found
                    }).catch(err => {
                    this.log.error(err);
                    this.toastr.error(err, 'Error loading location!');
                    // the item was not found
                }).finally(() => {
                    this.progress.complete();
                });
            } else {
                this.navigated = false;
                this.location = new Location();
                this.location.coordinates = new Array<number>(2);
            }
        });
        //this.getTags();
    }


    onSubmit() {
        this.log.info('Saving location',this.location.name);
        this.progress.start();
        // convert ngx-chips array list to ddb optimized set
        //this.location.lotype = LocationType.PLACE;

        this.locationService.save(this.location).then(objectSaved => {
            this.toastr.success('Location '+this    .location.name + ' is save!', 'Got it!');
        }).catch(reason => {
            this.toastr.error(reason,"Error during save");
        }).finally(() => {
            this.progress.complete();
        })
    }

    onDelete() {
        const confirm = window.confirm('Do you really want to delete this location?');
        if (confirm) {
            this.progress.start();
            this.locationService.delete(this.location).then(value => {
                this.toastr.info("Location successfully deleted");
                this.router.navigate(['/securehome/locations']);
            }).catch(reason => {
                this.toastr.error(reason,"Error during location deletion");
            }).finally(() => {
                this.progress.complete();
            });
        }
    }



    isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login']);
        } else {
            this.log.debug("authenticated");
        }
    }
}
