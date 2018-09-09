import {Component, OnInit, Input} from '@angular/core';
import {Dish} from '../../model/dish';
import {DishService} from '../../service/dish.service';
import { HttpClient } from '@angular/common/http';
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
    preventAbuse = false;
    public selectableTags = ['Soup','Spicy','Noodles'];
    //public selectedTags: TagModel[];

    constructor(private dishService: DishService,private http: HttpClient) {
    }

    ngOnInit() {

    }

    onRefresh() {
        console.log("proudly presents dish details of " +this.dish.id);
        this.dishService.getDishDetails(this.dish)
            .then(myItem => {
                console.log("found it" + JSON.stringify(myItem));
                this.dish = myItem;
                // the item was found
            })
            .catch(err => {
                console.error(err);
                // the item was not found
            });
    }

    onDelete() {
        console.log("wegdisch");
         this.dishService.deleteDish(this.dish);
    }

    onSubmit() {
        console.log('Saving dish tags' + JSON.stringify(this.dish));

        this.dishService.saveDish(this.dish);
        //this.dishService.scanDishes().subscribe(dishes => this.dishes = dishes);
    }


    testHttp() {
        this.preventAbuse = true;
        this.http.get('https://reqres.in/api/users?delay=2').subscribe(res => {
            console.log(res);
            setTimeout(() => {
                this.preventAbuse = false;
            }, 800);
        });
    }
    // TODO: Remove this when we're done
    get diagnostic() {
        return JSON.stringify(this.dish);
    }
}
