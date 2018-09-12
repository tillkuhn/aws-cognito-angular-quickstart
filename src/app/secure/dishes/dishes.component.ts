import {Component, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {NgProgress} from '@ngx-progressbar/core';

@Component({
    selector: 'app-dishes',
    templateUrl: './dishes.component.html',
    styleUrls: ['./dishes.component.css']
})
export class DishesComponent implements OnInit {
    dishes: Dish[] = [];
    selectedDish: Dish;
    addingDish = false;

    /*
    error: any;
    showNgFor = false;
    */

    constructor(
        private dishService: DishService,
        private progress: NgProgress,
        private router: Router
    ) {}

    ngOnInit() {
        this.getDishes();
    }

    async getDishes() {
        this.startServiceCall("getDishes");
        for await (const item of this.dishService.getDishes()) {
            this.dishes.push(item);
        };
        this.stopServiceCall("getDishes");
    }

    onSelect(dish: Dish): void {
        this.selectedDish = dish;
        this.addingDish = false;
        this.gotoDetail(dish);
    }

    gotoDetail(dish: Dish): void {
        this.router.navigate(['/securehome/dish-details', dish.id]);
    }



    // check https://www.bennadel.com/blog/3217-defining-function-and-callback-interfaces-in-typescript.htm
    startServiceCall(operation: string) {
        this.progress.start();
        console.log(operation + ' started getlos');
    }

    stopServiceCall(operation: string) {
        this.progress.complete();
        console.log(operation + ' completed');
    }

}
