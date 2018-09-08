import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {Dish} from '../model/dish';
import {CognitoUtil} from './cognito.service';
import {DataMapper, ScanIterator, ScanOptions} from '@aws/dynamodb-data-mapper';
// import { MessageService } from './message.service';
@Injectable()
export class DishService {

    // constructor(private messageService: MessageService) { }
    constructor(public cognitoUtil: CognitoUtil) {
    }


    async scanDishes(dishes: Dish[]) {
        //ProjectionExpressionA string that identifies one or more attributes to retrieve from the table. T"Description, RelatedItems[0], ProductReviews.FiveStar"
        let newVar = {
            projection: ['id','name','rating']
        };

        //options.projection =  ['id','name','rating'];
        for await (const item of this.getMapper().scan({valueConstructor: Dish,projection: ['id','name','rating','origin','createdAt']})) {
         //for await (const item of this.getMapper().scan(Dish)) {
        // individual items will be yielded as the scan is performed
            dishes.push(item);
        }
    } q

    saveDish(dish) { // put
        //const toSave = Object.assign(new MyDomainObject, {id: 'foo'});
        this.getMapper().put(dish).then(objectSaved => {
            console.log('Dish is save');
        })
    }

    getDishDetails(dish: Dish) {
        return this.getMapper().get(Object.assign(new Dish(), {id: dish.id,createdAt: dish.createdAt}));
    }

    deleteDish(dish: Dish) {
        return this.getMapper().delete(Object.assign(new Dish(), {id: dish.id,createdAt: dish.createdAt}));
    }

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
