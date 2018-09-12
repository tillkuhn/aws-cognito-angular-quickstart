import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {TagModel} from 'ngx-chips/core/accessor';
import {ToastrService} from 'ngx-toastr';
import {NGXLogger} from 'ngx-logger';

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
    selectableTags = ['Soup', 'Spicy', 'Noodles', 'deftig', 'kartoffeln'];
    selectedTags: Array<string> = [];

    error: any;
    debug: false;
    navigated = false; // true if navigated here


    constructor(
        private dishService: DishService,
        private http: HttpClient,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private logger: NGXLogger
    ) {
    }

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            if (params['id'] !== undefined) {
                const id = params['id'];
                this.navigated = true;
                this.dishService.getDishDetails(id)
                    .then(dishItem => {
                        this.logger.info('found item' + dishItem.tags.entries());
                        for (var it = dishItem.tags.values(), val = null; val = it.next().value;) {
                            this.selectedTags.push(val);
                        }
                        this.dish = dishItem;
                        // the item was found
                    })
                    .catch(err => {
                        console.error(err);
                        // the item was not found
                    });
            } else {
                this.navigated = false;
                this.dish = new Dish();
            }
        });
    }

    onAdding(tag: TagModel): Observable<TagModel> {
        //const confirm = window.confirm('Do you really want to add this tag?');
        // Adding {"display":"Spicy","value":"Spicy"}
        this.logger.info('Adding ' + JSON.stringify(tag));
        //this.selectedTags.push(tag.value);
        return of(tag);
        //return Observable
        //    .of(tag)
        //    .filter(() => confirm);
    }


    onDelete() {
        this.logger.info('wegdisch');
        this.dishService.deleteDish(this.dish);
    }

    onSubmit() {
        let settags: Set<string> = new Set<string>();
        for (let item in this.selectedTags) {
            this.logger.info('add ' + item);

            settags.add(this.selectedTags[item]);
        }
        this.dish.tags = settags;
        this.logger.info('Saving dish tags' + JSON.stringify(this.dish));
        this.dishService.saveDish(this.dish).then(objectSaved => {
            this.toastr.success('Dish is save!', 'Hurray!');
        })

        //this.dishService.scanDishes().subscribe(dishes => this.dishes = dishes);
    }

}
