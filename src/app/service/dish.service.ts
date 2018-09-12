import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {Dish} from '../model/dish';
import {CognitoUtil} from './cognito.service';
import {DataMapper, ScanIterator, ScanOptions} from '@aws/dynamodb-data-mapper';
// import { MessageService } from './message.service';
@Injectable()

// Read https://awslabs.github.io/dynamodb-data-mapper-js/packages/dynamodb-data-mapper/
export class DishService {

    // constructor(private messageService: MessageService) { }
    constructor(public cognitoUtil: CognitoUtil) {
    }


    getDishes() {
        const returnFields = ['id','name','rating','origin','createdAt','timesServed','tags']; //one or more attributes to retrieve from the table.
        return this.getMapper().scan({valueConstructor: Dish,projection: returnFields});
    }

    /**
     * Save dish (PUT)
     * @param dish
     */
    saveDish(dish) { // put
        //const toSave = Object.assign(new MyDomainObject, {id: 'foo'});
        // update stamp
        dish.updatedAt = new Date().toISOString();
        dish.updatedBy = this.cognitoUtil.getCurrentUser().getUsername();
        return this.getMapper().put(dish);
    }

    getDishDetails(dishId) {
        console.log("Get " + dishId);
        return this.getMapper().get(Object.assign(new Dish(), {id: dishId}));
        //     .catch(err => {
        //         // the item was not found
        //     })
    }

    deleteDish(dish: Dish) {
        return this.getMapper().delete(Object.assign(new Dish(), {id: dish.id,createdAt: dish.createdAt}));
    }

    /* Helper */
    getMapper() {
        let clientParams:any = {};
        if (environment.dynamodb_endpoint) {
            clientParams.endpoint = environment.dynamodb_endpoint;
        }
        clientParams.region = environment.region;
        return new DataMapper({
            client: new DynamoDB(clientParams), // the SDK client used to execute operations
            tableNamePrefix: 'yummy-' // optionally, you can provide a table prefix to keep your dev and prod tables separate
        });
    }

    // getDishesOld(): Observable<Dish[]> {
    // return of(dishes);
    //}


}
