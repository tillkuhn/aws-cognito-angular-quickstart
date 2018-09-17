import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {NgProgress} from '@ngx-progressbar/core';
import {NGXLogger} from 'ngx-logger';
import {CacheService} from '@ngx-cache/core';
import {ToastrService} from 'ngx-toastr';

// Async functions always return a promise, whether you use await or not. That promise resolves with whatever the async
// function returns, or rejects with whatever the async function throws. So with:

@Component({
    selector: 'app-dishes',
    templateUrl: './dishes.component.html',
    styleUrls: ['./dishes.component.css']
})
export class DishesComponent {

    readonly cacheKeyDishes: string = 'dishes';
    readonly cacheKeyDishQeury: string = 'dishes-query';

    dishes: Array<Dish> = [];
    selected: Array<Dish> = [];
    debug: false;
    query: string;

    constructor(
        private dishService: DishService,
        private progress: NgProgress,
        private router: Router,
        private readonly cache: CacheService,
        private toastr: ToastrService,
        private log: NGXLogger
    ) {
        if (this.cache.has(this.cacheKeyDishes)) {
            this.log.info('dishes coming from cache ', this.cacheKeyDishes);
            this.dishes = this.cache.get(this.cacheKeyDishes); // restore from previous visit
        }
        this.query = this.cache.get(this.cacheKeyDishQeury); // restore from previous visit, or null
    }


    onRefresh(): void {
        this.progress.start(); // let's see some progress
        this.cache.set(this.cacheKeyDishQeury, this.query); // keep new search query for revist
        this.dishes.length=0; //clean existing results
        this.dishService.getDishes(this.query,
            (err, data) => {
                if (err) {
                    this.toastr.error('DynamoDBService: Unable to query dish table.', JSON.stringify(err, null, 2));
                } else {
                    // print all the movies
                    this.log.info('DynamoDBService: Query succeeded.');
                    data.Items.forEach((ddbDish: Dish) => {
                        //mapArray.push({type: logitem.type, date: logitem.activityDate});
                        let dish : Dish = new Dish();
                        this.log.info(JSON.stringify(ddbDish.tags));
                        // need to convert, internal format
                        // {"wrapperName":"Set","values":["auflauf","fisch","lachs","tomaten"],"type":"String"}
                        if (ddbDish.tags) {
                            let tagSet: Set<string> = new Set<string>();
                            for (let val of ddbDish.tags.values) {
                                tagSet.add(val);
                            }
                            ddbDish.tags = tagSet;
                        }
                        this.dishes.push(ddbDish);
                    });
                    this.dishes=[...this.dishes]; //https://github.com/swimlane/ngx-datatable/issues/934 hack
                    this.cache.set(this.cacheKeyDishes, this.dishes); // keep new search query for revist
                    this.progress.complete();
                }
            });
        // https://github.com/swimlane/ngx-datatable/issues/934
    }

    onSelect({selected}) {
        this.log.debug('Select Event', selected, this.selected);
        this.gotoDetail(selected[0]);
    }

    gotoDetail(dish: Dish): void {
        this.router.navigate(['/securehome/dish-details', dish.id]);
    }

}
