import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {Dish} from '../model/dish';
import {CognitoUtil} from './cognito.service';
import {DataMapper, ScanIterator, ScanOptions} from '@aws/dynamodb-data-mapper';
import {NGXLogger} from 'ngx-logger';
import {ConditionExpression, equals, ConditionExpressionPredicate, SimpleConditionExpression} from '@aws/dynamodb-expressions';
import {Stuff} from '../secure/useractivity/useractivity.component';
import * as AWS from 'aws-sdk/global';

// See https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Condition.html
//https://github.com/awslabs/dynamodb-data-mapper-js/tree/master/packages/dynamodb-expressions
// https://awslabs.github.io/dynamodb-data-mapper-js/packages/dynamodb-expressions/
//ttps://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.htmlh
//https://stackoverflow.com/questions/36620571/using-contains-filter-in-dynamodb-scan-with-java
@Injectable()
export class DishService {

    readonly summaryReturnFields = ['id', 'name','authenticName', 'rating', 'origin', 'createdAt', 'timesServed', 'tags'];

    constructor(
        public cognitoUtil: CognitoUtil,
        private log: NGXLogger
    ){}

    getDishes(query?: string) {
        if (query) {

            //object may be an attribute path, an attribute value, or another type. If the lattermost type is received, it will be serialized using the @aws/dynamodb-auto-marshaller package.
            let equalsExpressionPredicate: ConditionExpressionPredicate = {
                type: 'Equals',
                object: query
            };
            const equalsExpression1: SimpleConditionExpression = {
                ...equalsExpressionPredicate,
                subject: 'name'
            };
            const equalsExpression2: SimpleConditionExpression = {
                ...equalsExpressionPredicate,
                subject: 'authenticName'
            };
            const orExpression: ConditionExpression = {
                type: 'Or',
                conditions: [
                    equalsExpression1,
                    equalsExpression2
                ]
            };
            return this.getMapper().scan({
                valueConstructor: Dish, projection: this.summaryReturnFields, limit: 100,
                filter: orExpression
            });
        } else {
            this.log.info("scanning dishes from ddb");
            return this.getMapper().scan({valueConstructor: Dish, projection: this.summaryReturnFields});
        }
    }


    getDishes2(query) {
        // ConditionExpressionPredicate does not support contains
        console.log("DynamoDBService: reading from DDB with creds");
        let params = {
            TableName: "yummy-dish",
            ProjectionExpression: 'id,authenticName,rating,origin,createdAt,timesServed,tags',
        };
        if (query) {
            FilterExpression: 'contains (#dishname, :query) or contains (authenticName, :query)';
            ExpressionAttributeNames: {"#dishname":"name"};
            ExpressionAttributeValues: {":query": query};

        }
        var clientParams:any = {};
        if (environment.dynamodb_endpoint) {
            clientParams.endpoint = environment.dynamodb_endpoint;
        }
        clientParams.region = environment.region;
        var docClient = new DynamoDB.DocumentClient(clientParams);
        docClient.scan(params, onQuery);

        function onQuery(err, data) {
            if (err) {
                console.error("DynamoDBService: Unable to query the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                // print all the movies
                console.log("DynamoDBService: Query succeeded.");
                data.Items.forEach(function (dish) {
                    //mapArray.push({type: logitem.type, date: logitem.activityDate});
                    console.log(dish.name,dish.authenticName);
                });
            }
        }
    }

    getTagMap() {
        return this.getMapper().scan({valueConstructor: Dish, projection: ['tags']});
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
        return this.getMapper().get(Object.assign(new Dish(), {id: dishId}));
    }

    deleteDish(dish: Dish) {
        return this.getMapper().delete(Object.assign(new Dish(), {id: dish.id, createdAt: dish.createdAt}));
    }

    /* Helper */
    getMapper() {
        let clientParams: any = {};
        if (environment.dynamodb_endpoint) {
            clientParams.endpoint = environment.dynamodb_endpoint;
        }
        clientParams.region = environment.region;
        return new DataMapper({
            client: new DynamoDB(clientParams), // the SDK client used to execute operations
            tableNamePrefix: 'yummy-' // optionally, you can provide a table prefix to keep your dev and prod tables separate
        });
    }

}
