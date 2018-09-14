import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {NgProgress} from '@ngx-progressbar/core';
import {NGXLogger} from 'ngx-logger';
import { CacheService} from '@ngx-cache/core';
@Component({
    selector: 'app-dishes',
    templateUrl: './dishes.component.html',
    styleUrls: ['./dishes.component.css']
})
export class DishesComponent  {

    readonly cacheKeyDishes: string = 'dishes';

    dishes: Array<Dish> = [];
    selected: Array<Dish> = [];
    debug: false;

    constructor(
        private dishService: DishService,
        private progress: NgProgress,
        private router: Router,
        private readonly cache: CacheService,
        private log: NGXLogger
    ) {
        this.getDishes();
    }

    getDishes(): void  {

        if (this.cache.has(this.cacheKeyDishes)) {
            this.log.info("dishes coming from cache ", this.cacheKeyDishes);
            this.dishes=this.cache.get(this.cacheKeyDishes);
        } else {
            this.progress.start();
            this.log.info("dished not cached loading start");
            this.loadDishes().then((resolve) => {
                this.log.info("Loading resolved");
                this.dishes = resolve;
                this.cache.set(this.cacheKeyDishes, resolve);
            }).finally(() => {
                this.log.info("Loading complete");
                this.progress.complete();
            });
        }
    }

    async loadDishes(): Promise<Array<Dish>> {
        // Async functions always return a promise, whether you use await or not. That promise resolves with whatever the async
        // function returns, or rejects with whatever the async function throws. So with:
        let newDishes = new Array<Dish>();
        for await (const item of this.dishService.getDishes()) {
            newDishes.push(item);
        };
        return newDishes;
    }

    onRefresh() {
        this.cache.remove(this.cacheKeyDishes); // evict
        this.getDishes();
    }

    onSelect({ selected }) {
        this.log.debug('Select Event', selected, this.selected);
        this.gotoDetail(selected[0]);
    }

    gotoDetail(dish: Dish): void {
        this.router.navigate(['/securehome/dish-details', dish.id]);
    }

}
