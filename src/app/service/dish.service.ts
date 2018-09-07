import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import * as AWS from 'aws-sdk/global';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {Dish} from '../model/dish';
import {CognitoUtil} from './cognito.service';
import {DataMapper, ScanIterator} from '@aws/dynamodb-data-mapper';
// import { MessageService } from './message.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class DishService {

    // constructor(private messageService: MessageService) { }
    constructor(public cognitoUtil: CognitoUtil) {
    }

    // See https://github.com/awslabs/dynamodb-data-mapper-js/blob/master/README.md
    updateDish(dish: Dish) {
        const mapper = new DataMapper({
            client: new DynamoDB({region: 'eu-central-1'}), // the SDK client used to execute operations
            tableNamePrefix: 'yummy' // optionally, you can provide a table prefix to keep your dev and prod tables separate
        });
        mapper.put(dish).then(objectSaved => {
            // the record has been saved
        });

    }

    async scanDishes( ) {
        const mapper = new DataMapper({
            client: new DynamoDB({region: 'eu-central-1'}), // the SDK client used to execute operations
            tableNamePrefix: 'yummy' // optionally, you can provide a table prefix to keep your dev and prod tables separate
        });
        let dishes = new Array();
        for await (const item of mapper.scan(Dish)) {
            // individual items will be yielded as the scan is performed
            dishes.push(of(item));
        }
        return of(dishes);
        //return mapper.scan(Dish);
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

        return of(dishes);
    }
}
