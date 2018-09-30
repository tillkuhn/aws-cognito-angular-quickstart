import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {Location, LocationType} from '../../model/location';
import {LocationService} from '../../service/location.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {NgProgress} from '@ngx-progressbar/core';
import {CacheService} from '@ngx-cache/core';
import {NGXLogger} from 'ngx-logger';
import {LoggedInCallback} from '../../service/cognito.service';
import {IdPrefix, S3Service} from '../../service/s3.service';
import {humanizeBytes, UploaderOptions, UploadFile, UploadInput, UploadOutput} from 'ngx-uploader';
import {IMyDpOptions} from 'mydatepicker';
import {GeoPoint} from '../../model/geopoint'
import {Observable} from 'rxjs';

@Component({
    selector: 'app-location-detail',
    templateUrl: './location-detail.component.html',
    styleUrls: []
})
export class LocationDetailComponent implements OnInit, LoggedInCallback {

    @Input() location: Location;

    // selectableTags: Array<LocationTag> = [];
    // selectedTags: Array<string> = [];
    countries: Array<Location>;
    doclist: Observable<Array<any>>;
    lotypes = LocationType;
    lotypeKeys: string[];

    error: any;
    debug: false;
    navigated = false; // true if navigated here

    // for uploader
    options: UploaderOptions;
    files: UploadFile[];
    uploadInput: EventEmitter<UploadInput>;
    humanizeBytes: Function;
    dragOver: boolean;


    public myDatePickerOptions: IMyDpOptions = {
        // other options...
        dateFormat: 'yyyy-mm-dd',
        inline: false,
        width: "300px",
    };

    constructor(
        private locationService: LocationService,
        private http: HttpClient,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private progress: NgProgress,
        private readonly cache: CacheService,
        private log: NGXLogger,
        private router: Router,
        private s3: S3Service
    ) {
    }

    ngOnInit(): void {
        this.lotypeKeys = Object.keys(LocationType).filter(k => !isNaN(Number(k)));
        this.countries = this.locationService.getCountries();

        this.route.params.forEach((params: Params) => {
            if (params['id'] !== undefined) {  // RESTful URL to existing ID?
                const id = params['id'];
                this.navigated = true;
                this.progress.start();

                this.doclist = this.s3.viewDocs(IdPrefix.places, id);

                this.locationService.get(id)
                    .then(locationItem => {
                        this.location = locationItem;
                        if (!this.location.coordinates) {
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
                // new Entity
                this.navigated = false;
                this.location = new Location();
                this.location.coordinates = new Array<number>(2);
                this.location.lotype = LocationType.Place;
                this.location.imageUrl = '/assets/unknown.jpg';
            }
        });

        // Uploader
        this.options = { concurrency: 1, maxUploads: 3 };
        this.files = []; // local uploading files array
        this.uploadInput = new EventEmitter<UploadInput>(); // input events, we use this to emit data to ngx-uploader
        this.humanizeBytes = humanizeBytes;
    }

    onSubmit() {
        this.log.info('Saving location', this.location.name);
        this.progress.start();
        // convert ngx-chips array list to ddb optimized set
        // this.location.lotype = LocationType.PLACE;
        // this.s3.addDoc("hase777.txt");
        this.locationService.save(this.location).then(objectSaved => {
            this.location = objectSaved; // update with values resulting from db insert e.g. id or updateDate
            this.toastr.success('Location ' + this.location.name + ' is save!', 'Got it!');
        }).catch(reason => {
            this.toastr.error(reason, 'Error during save');
        }).finally(() => {
            this.progress.complete();
        })
    }

    onChangeCoordinates(event: any) {
        // https://github.com/perfectline/geopoint
        if (event.target.value) {
            this.location.coordinates[0] =  Number(event.target.value.split(/[\s]+/)[1]);
            this.location.coordinates[1] =  Number(event.target.value.split(/[\s]+/)[0]);
        } else {
            // clean
        }
    }

    getDegrees(): string {
        if (this.location.coordinates[0] && this.location.coordinates[1]) {
            const point = new GeoPoint(this.location.coordinates[0],this.location.coordinates[1]);
            return point.getLatLonDeg();
        } else {
            return "No coordinates defined";
        }
    }
    onDelete() {
        const confirm = window.confirm('Do you really want to delete this location?');
        if (confirm) {
            this.progress.start();
            this.locationService.delete(this.location).then(value => {
                this.toastr.info('Location successfully deleted');
                this.router.navigate(['/securehome/locations']);
            }).catch(reason => {
                this.toastr.error(reason, 'Error during location deletion');
            }).finally(() => {
                this.progress.complete();
            });
        }
    }

    onUploadOutput(output: UploadOutput): void {
        this.log.info('onUploadOutput '+ JSON.stringify(output));
        if (output.type === 'addedToQueue'  && typeof output.file !== 'undefined') { // when all files added in queue
            this.log.info('onUploadOutput allAdded ' + output);
            //  {"type":"addedToQueue","file":{"fileIndex":0,"id":"ouacdu","name":"tk4.txt","size":8,"type":"text/plain","form":{},
            // "progress":{"status":0,"data":{"percentage":0,"speed":0,"speedHuman":"0 Byte/s",
            // "startTime":null,"endTime":null,"eta":null,"etaHuman":null}},"lastModifiedDate":"2018-09-17T22:57:48.809Z","nativeFile":{}}}
            const file: File = output.file.nativeFile;
            // var fileStream = fs.createReadStream("F:/directory/fileName.ext");
            // let fileStream = fs.createReadStream("F:/directory/fileName.ext");
            // https://github.com/bleenco/ngx-uploader/issues/365
            // https://stackoverflow.com/questions/13807339/upload-a-binary-file-to-s3-using-aws-sdk-for-node-js
            const reader = new FileReader();
            reader.onload = (e) => {
                // console.log(e.target.result);
                this.log.info('Got it adding content of ' + output.file.name + ' to s3');
                this.s3.addDoc(output.file, reader.result, IdPrefix.places, this.location.id);
                this.toastr.success( output.file.name + ' stored in S3', 'Upload successful');
            }
            reader.readAsArrayBuffer(file);
            // reader.readAsBinaryString(file);
            // uncomment this if you want to auto upload files when added
            // const event: UploadInput = {
            //   type: 'uploadAll',
            //   url: '/upload',
            //   method: 'POST',
            //   data: { foo: 'bar' }
            // };
            // this.uploadInput.emit(event);
        } else if (output.type === 'addedToQueue'  && typeof output.file !== 'undefined') { // add file to array when added
            this.files.push(output.file);
        } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
            // update current data in files array for uploading file
            const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
            this.files[index] = output.file;
        } else if (output.type === 'removed') {
            // remove file from array when removed
            this.files = this.files.filter((file: UploadFile) => file !== output.file);
        } else if (output.type === 'dragOver') {
            this.dragOver = true;
        } else if (output.type === 'dragOut') {
            this.dragOver = false;
        } else if (output.type === 'drop') {
            this.dragOver = false;
        }
    }

    // https://github.com/bleenco/ngx-uploader/issues/365
    startUpload(): void {
        this.log.info('start Uploading ');
        const event: UploadInput = {
            type: 'uploadAll',
        //url: 'http://ngx-uploader.com/upload',
            method: 'POST',
            data: {foo: 'bar'}
        };

        this.uploadInput.emit(event);
    }

    isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login']);
        } else {
            this.log.debug('authenticated');
        }
    }
}
