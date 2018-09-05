import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { Dish } from '../model/dish';
import { DISHES } from '../model/mock-dishes';
// import { MessageService } from './message.service';

@Injectable()
export class DishService {

  // constructor(private messageService: MessageService) { }
     constructor() { }

  getDishes(): Observable<Dish[]> {
    // TODO: send the message _after_ fetching the dishes
    // this.messageService.add('DishService: fetched dishes');
    return Observable.of(DISHES);
  }
}
