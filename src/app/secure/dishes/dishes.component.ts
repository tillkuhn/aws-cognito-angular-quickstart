import { Component, OnInit } from '@angular/core';
import { Dish } from '../../model/dish';
import { DishService } from '../../service/dish.service';

@Component({
  selector: 'app-dishes',
  templateUrl: './dishes.component.html',
  styleUrls: ['./dishes.component.css']
})
export class DishesComponent implements OnInit {

  dishes: Dish[];

  selectedDish: Dish;
  constructor(private dishService: DishService ) { }

  ngOnInit() {
    this.getDishes();
  }

  onSelect(dish: Dish): void {
    this.selectedDish = dish;
  }

  getDishes(): void {
    this.dishService.getDishes()
      .subscribe(dishes => this.dishes = dishes);
  }
}
