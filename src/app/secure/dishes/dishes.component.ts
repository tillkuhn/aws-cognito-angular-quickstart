import {Component, OnInit, ViewChild} from '@angular/core';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import {NgProgress} from '@ngx-progressbar/core';

@Component({
    selector: 'app-dishes',
    templateUrl: './dishes.component.html',
    styleUrls: ['./dishes.component.css']
})
export class DishesComponent implements OnInit {
    dishes: Array<Dish>;

    selectedDish: Dish;

    constructor(private dishService: DishService, public progress: NgProgress) {
    }

    ngOnInit() {
        this.getDishes();
    }

    onSelect(dish: Dish): void {
        this.selectedDish = dish;
    }

    getDishes(): void {
        //this.progress.start();

        console.log('Scanning dishes');
        this.dishes = new Array<Dish>();
        this.dishService.scanDishes(this.dishes);
        //this.progress.complete();
        //this.dishService.scanDishes().subscribe(dishes => this.dishes = dishes);
    }
}
