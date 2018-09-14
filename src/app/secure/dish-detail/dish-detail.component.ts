import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {HttpClient} from '@angular/common/http';
import {TagModel} from 'ngx-chips/core/accessor';
import {ToastrService} from 'ngx-toastr';
import {NGXLogger} from 'ngx-logger';
import {DishTag} from '../../model/DishTag';
import {NgProgress} from '@ngx-progressbar/core';

/*
export interface AutoCompleteModel {
    value: any;
    display: string;
}
*/

@Component({
    selector: 'app-dish-detail',
    templateUrl: './dish-detail.component.html',
    styleUrls: ['./dish-detail.component.css']
})
export class DishDetailComponent implements OnInit {

    @Input() dish: Dish;
    selectableTags: Array<DishTag> = [];
    selectedTags: Array<string> = [];

    error: any;
    debug: false;
    navigated = false; // true if navigated here


    constructor(
        private dishService: DishService,
        private http: HttpClient,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private progress: NgProgress,
        private log: NGXLogger
    ) {
    }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            if (params['id'] !== undefined) {
                const id = params['id'];
                this.navigated = true;
                this.progress.start();
                this.dishService.getDishDetails(id)
                    .then(dishItem => {
                        if (dishItem.tags) {
                            this.log.info('found item' + dishItem.tags.entries());
                            for (var it = dishItem.tags.values(), val = null; val = it.next().value;) {
                                this.selectedTags.push(val);
                            }
                        }
                        this.dish = dishItem;
                        // the item was found
                    })
                    .catch(err => {
                        this.log.error(err);
                        this.toastr.error(err, 'Error!');
                        // the item was not found
                    })
                    .finally(() => {
                        this.progress.complete();
                    });
            } else {
                this.navigated = false;
                this.dish = new Dish();
            }
        });
        this.initTagMap();
    }

    async initTagMap() {
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
        tagmap.forEach((val: number, key: string) => {
            this.selectableTags.push({
                display: key.charAt(0).toUpperCase() + key.slice(1) + ' (' + val + ')',
                value: key.toLocaleLowerCase(),
                rank: val
            })
        });
        // sort descending by value
        this.selectableTags.sort(function (a: DishTag, b: DishTag) {
            return (b.rank > a.rank) ? 1 : ((a.rank > b.rank) ? -1 : 0);
        });

    }


    onDelete() {
        const confirm = window.confirm('Do you really want to delete this dish?');
        if (confirm) {
            this.log.info('wegdisch');
            this.dishService.deleteDish(this.dish);
        }
    }

    onSubmit() {
        let settags: Set<string> = new Set<string>();
        for (let item in this.selectedTags) {
            settags.add(this.selectedTags[item]);
        }
        this.dish.tags = settags;
        this.log.info('Saving dish tags' + JSON.stringify(this.dish));
        this.dishService.saveDish(this.dish).then(objectSaved => {
            this.toastr.success('Dish is save!', 'Hurray!');
        })

        //this.dishService.scanDishes().subscribe(dishes => this.dishes = dishes);
    }

}
