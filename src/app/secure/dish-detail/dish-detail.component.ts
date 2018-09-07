import {Component, OnInit, Input} from '@angular/core';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';

@Component({
    selector: 'app-dish-detail',
    templateUrl: './dish-detail.component.html',
    styleUrls: ['./dish-detail.component.css']
})
export class DishDetailComponent implements OnInit {

    @Input() dish: Dish;

    constructor(private dishService: DishService) {
    }

    ngOnInit() {
    }

    onSubmit() {
        console.log('Saving dish');
        this.dishService.saveDish(this.dish);
        //this.dishService.scanDishes().subscribe(dishes => this.dishes = dishes);
    }

    // TODO: Remove this when we're done
    get diagnostic() {
        return JSON.stringify(this.dish);
    }
}