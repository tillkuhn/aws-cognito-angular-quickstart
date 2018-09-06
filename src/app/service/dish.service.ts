import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

// import {Stuff} from "../secure/useractivity/useractivity.component";
import * as AWS from 'aws-sdk/global';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {Dish} from '../model/dish';
import {DISHES} from '../model/mock-dishes';
import {CognitoUtil} from './cognito.service';
import {Stuff} from '../secure/useractivity/useractivity.component';

// import { MessageService } from './message.service';

@Injectable()
export class DishService {

    // constructor(private messageService: MessageService) { }
    constructor(public cognitoUtil: CognitoUtil) {
    }

    getDishesMock(): Observable<Dish[]> {
        // TODO: send the message _after_ fetching the dishes
        // this.messageService.add('DishService: fetched dishes');
        return Observable.of(DISHES);
    }

    getDishes(): Observable<Dish[]> {
        console.log('DynamoDBService: reading dishes from DDB');
        let dishes = new Array();
        let params = {
            TableName: 'yummy-dish'
            /*,


            ExpressionAttributeNames: { '#type': 'type' },
            KeyConditionExpression: '#type = :typevalue',
            ExpressionAttributeValues: {
                ':typevalue': 'dish'
            }*/
        };

        let clientParams: any = {};
        if (environment.dynamodb_endpoint) {
            clientParams.endpoint = environment.dynamodb_endpoint;
        }
        let docClient = new DynamoDB.DocumentClient(clientParams);
        docClient.scan(params, onQuery);

        function onQuery(err, data) {
            if (err) {
                console.error('DynamoDBService: Unable to query the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                // print all the movies
                console.log('DynamoDBService: Query succeeded.');
                data.Items.forEach(function (dishitem) {
                    dishes.push({id: dishitem.id, name: dishitem.name, rating: dishitem.rating})
                    // mapArray.push({type: logitem.type, date: logitem.activityDate});
                });
            }
        }

        return Observable.of(dishes);
    }
}
