import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import * as AWS from 'aws-sdk/global';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {Dish} from '../model/dish';
import {CognitoUtil} from './cognito.service';
import {DataMapper, ScanIterator} from '@aws/dynamodb-data-mapper';
// import { MessageService } from './message.service';
import {Observable, of} from 'rxjs';

@Injectable()
export class DishService {

    // constructor(private messageService: MessageService) { }
    constructor(public cognitoUtil: CognitoUtil) {
    }


    async scanDishes(dishes: Dish[]) {
        const mapper = new DataMapper({
            client: new DynamoDB({region: 'eu-central-1'}), // the SDK client used to execute operations
            tableNamePrefix: 'yummy-' // optionally, you can provide a table prefix to keep your dev and prod tables separate
        });
        //let dishes = new Array();
        for await (const item of mapper.scan(Dish)) {
            // individual items will be yielded as the scan is performed
            dishes.push(item);
        }
    }

    saveDish(dish) {
        //const toSave = Object.assign(new MyDomainObject, {id: 'foo'});
        this.getMapper().put(dish).then(objectSaved => {
            console.log('Dish is save');
        })
    }

    getMapper() {
        return new DataMapper({
            client: new DynamoDB({region: 'eu-central-1'}), // the SDK client used to execute operations
            tableNamePrefix: 'yummy-' // optionally, you can provide a table prefix to keep your dev and prod tables separate
        });
    }

    // getDishesOld(): Observable<Dish[]> {
    // return of(dishes);
    //}


}
