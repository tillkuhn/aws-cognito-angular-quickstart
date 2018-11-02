import {Component, OnInit, Input, EventEmitter} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
//import {TagModel} from 'ngx-chips/core/accessor';
import {ToastrService} from 'ngx-toastr';
import {NGXLogger} from 'ngx-logger';
import {NgProgress} from '@ngx-progressbar/core';
import {CacheService} from '@ngx-cache/core';

import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {LocationService} from '../../service/location.service';
import {DishTag} from '../../model/dish-tag';
import {Location} from '../../model/location';
import {LoggedInCallback} from '../../service/cognito.service';
import {humanizeBytes, UploaderOptions, UploadFile, UploadInput, UploadOutput} from 'ngx-uploader';
import {IdPrefix, S3Service} from '../../service/s3.service';
import {Observable} from 'rxjs';

@Component({
    selector: 'app-dish-detail',
    templateUrl: './dish-detail.component.html',
    styleUrls: ['./dish-detail.component.css']
})
export class DishDetailComponent implements OnInit, LoggedInCallback {

    @Input() dish: Dish;

    selectableTags: Array<DishTag> = [];
    selectedTags: Array<string> = [];
    origins: Array<Location>;
    error: any;
    debug: false;
    navigated = false; // true if navigated here
    doclist: Observable<Array<any>>;

    // for uploader
    options: UploaderOptions = {concurrency: 1, maxUploads: 3};
    files: UploadFile[] = [];
    uploadInput: EventEmitter<UploadInput> = new EventEmitter<UploadInput>();
    humanizeBytes: Function = humanizeBytes;

    constructor(
        private dishService: DishService,
        private http: HttpClient,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private progress: NgProgress,
        private readonly cache: CacheService,
        private log: NGXLogger,
        private router: Router,
        private locationService: LocationService,
        private s3: S3Service
    ) {
    }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            if (params['id'] !== undefined) {
                const id = params['id'];
                this.navigated = true;
                this.progress.start();
                this.doclist = this.s3.viewDocs(IdPrefix.dishes, id);

                this.dishService.getDishDetails(id)
                    .then(dishItem => {
                        if (dishItem.tags) {
                            for (let it = dishItem.tags.values(), val = null; val = it.next().value;) {
                                this.selectedTags.push(val);
                            }
                        }
                        this.dish = dishItem;
                        // the item was found
                    }).catch(err => {
                    this.log.error(err);
                    this.toastr.error(err, 'Error loading dish details!');
                    // the item was not found
                }).finally(() => {
                    this.progress.complete();
                });
            } else {
                this.navigated = false;
                this.dish = new Dish();
            }
        });
        this.getTags();
        this.origins = this.locationService.getCountries();
    }

    getTags(): void {
        const CACHE_KEY_TAGS: string = 'tags';

        if (this.cache.has(CACHE_KEY_TAGS)) {
            this.log.info('tags coming from cache ', CACHE_KEY_TAGS);
            this.selectableTags = this.cache.get(CACHE_KEY_TAGS);
        } else {
            this.progress.start();
            this.initTagMap().then((tagmap) => {
                tagmap.forEach((val: number, key: string) => {
                    this.selectableTags.push({
                        display: key + ' (' + val + ')',
                        value: key.toLocaleLowerCase(),
                        rank: val
                    })
                });
                // sort descending by value
                this.selectableTags.sort(function (a: DishTag, b: DishTag) {
                    return (b.rank > a.rank) ? 1 : ((a.rank > b.rank) ? -1 : 0);
                });
                this.cache.set(CACHE_KEY_TAGS, this.selectableTags);
            }).catch(err => {
                this.log.error(err);
                this.toastr.error(err, 'Error getting tags!');
                // the item was not found
            }).finally(() => {
                this.progress.complete();
            });
        }
    }

    async initTagMap(): Promise<Map<string, number>> {
        let tagmap: Map<string, number> = new Map();
        for await (const dishItem of this.dishService.getTagMap()) {
            if (dishItem.tags) {
                for (let it = dishItem.tags.values(), val = null; val = it.next().value;) {
                    let mapkey = val.toLocaleLowerCase();
                    if (tagmap.get(mapkey)) {
                        tagmap.set(mapkey, tagmap.get(mapkey) + 1);
                    } else {
                        tagmap.set(mapkey, 1);
                    }
                }
            }
        }
        return tagmap;
    }


    onDelete() {
        const confirm = window.confirm('Do you really want to delete this dish?');
        if (confirm) {
            this.progress.start();
            this.dishService.deleteDish(this.dish).then(value => {
                this.toastr.info('Dish successfully deleted');
            }).catch(reason => {
                this.toastr.error(reason, 'Error during dish deletion');
            }).finally(() => {
                this.progress.complete();
            });
        }
    }

    onJustServed() {
        if (isNaN(this.dish.timesServed)) {
            this.dish.timesServed = 1;
        } else {
            this.dish.timesServed += 1;
        }
    }

    onSubmit() {
        this.log.info('Saving dish', this.dish.name);
        this.progress.start();
        // convert ngx-chips array list to ddb optimized set
        let settags: Set<string> = new Set<string>();
        for (let item in this.selectedTags) {
            settags.add(this.selectedTags[item].toLocaleLowerCase());
        }
        this.dish.tags = settags;
        this.dishService.saveDish(this.dish).then(objectSaved => {
            this.toastr.success('Dish ' + this.dish.name + ' is save!', 'Got it!');
        }).catch(reason => {
            this.toastr.error(reason, 'Error during save');
        }).finally(() => {
            this.progress.complete();
        })
    }


    onUploadOutput(output: UploadOutput): void {
        this.log.info('onUploadOutput ' + JSON.stringify(output));
        if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') { // when all files added in queue
            //this.log.info('onUploadOutput allAdded ' + JSON.stringify(output));
            const file: File = output.file.nativeFile;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.log.info('Got it adding content of ' + output.file.name + ' to s3');
                this.s3.addDoc(output.file, reader.result, IdPrefix.dishes, this.dish.id);
                this.toastr.success(output.file.name + ' stored in S3', 'Upload successful');
            }
            reader.readAsArrayBuffer(file);
        } else if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') { // add file to array when added
            this.files.push(output.file);
        } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
            // update current data in files array for uploading file
            const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
            this.files[index] = output.file;
        } else if (output.type === 'removed') {
            // remove file from array when removed
            this.files = this.files.filter((file: UploadFile) => file !== output.file);
        }
    }

    isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login']);
        } else {
            this.log.debug('authenticated');
        }
    }
}
