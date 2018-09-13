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
export class DishesComponent implements OnInit {
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
        if (this.cache.has('dishes')) {
            this.log.info("dishes coming from cache");
            this.dishes=this.cache.get("dishes");
        } else {
            this.getDishes();
        }
    }

    ngOnInit() {
    }

    async getDishes() {
        this.startServiceCall('getDishes');
        let newDishes = new Array<Dish>();
        for await (const item of this.dishService.getDishes()) {
            newDishes.push(item);
        };
        //https://github.com/swimlane/ngx-datatable/issues/625
        this.dishes = [...newDishes];
        this.cache.set("dishes",this.dishes);
        this.stopServiceCall('getDishes');
    }


    onSelect({ selected }) {
        this.log.debug('Select Event', selected, this.selected);
        this.gotoDetail(selected[0]);
    }

    gotoDetail(dish: Dish): void {
        this.router.navigate(['/securehome/dish-details', dish.id]);
    }


    // check https://www.bennadel.com/blog/3217-defining-function-and-callback-interfaces-in-typescript.htm
    startServiceCall(operation: string) {
        this.progress.start();
        this.log.info(operation + ' started getlos');
    }

    stopServiceCall(operation: string) {
        this.progress.complete();
        this.log.info(operation + ' completed');
    }

}
