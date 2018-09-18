import {Injectable} from '@angular/core';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {NGXLogger} from 'ngx-logger';
import {DocumentClient, ScanInput} from 'aws-sdk/clients/dynamodb';
import {AWSError} from 'aws-sdk/global';
import {CognitoUtil} from './cognito.service';
import {DynamoDBUtil} from './ddb.service';
import {Dish} from '../model/dish';

// See https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Condition.html
// https://github.com/awslabs/dynamodb-data-mapper-js/tree/master/packages/dynamodb-expressions
// https://awslabs.github.io/dynamodb-data-mapper-js/packages/dynamodb-expressions/
// ttps://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.htmlh
// https://stackoverflow.com/questions/36620571/using-contains-filter-in-dynamodb-scan-with-java
@Injectable()
export class DishService {

    constructor(
        private cognitoUtil: CognitoUtil,
        private ddbUtil: DynamoDBUtil,
        private log: NGXLogger
    ) {}

    getDishes(query,callback?: (err: AWSError, data: DocumentClient.ScanOutput) => void) : void {
        // ConditionExpressionPredicate does not support contains
        this.log.info("DynamoDBService: reading from DDB matching",query);
        let params : ScanInput  = {
            TableName: this.ddbUtil.getTableName('dish'),
            ProjectionExpression: 'id,#dishname,authenticName,rating,origin,createdAt,timesServed,tags',
            ExpressionAttributeNames: {"#dishname":"name"}
        };
        if (query) {
            params.FilterExpression= 'contains (#dishname, :query) or contains (authenticName, :query) or contains (tags, :query)';
            params.ExpressionAttributeValues= {":query": query};
        }
        var docClient = new DynamoDB.DocumentClient(this.ddbUtil.getClientParams());
        docClient.scan(params, callback);
        // does not support contains queries
        // return this.getMapper().scan({valueConstructor: Dish, projection: this.summaryReturnFields});
    }

    getTagMap() {
        return this.ddbUtil.getMapper().scan({valueConstructor: Dish, projection: ['tags']});
    }

    /**
     * Save dish (PUT)
     * @param dish
     */
    saveDish(dish) { // put
        // const toSave = Object.assign(new MyDomainObject, {id: 'foo'});
        // update stamp
        dish.updatedAt = new Date().toISOString();
        dish.updatedBy = this.cognitoUtil.getCurrentUser().getUsername();
        return this.ddbUtil.getMapper().put(dish);
    }

    getDishDetails(dishId) {
        return this.ddbUtil.getMapper().get(Object.assign(new Dish(), {id: dishId}));
    }

    deleteDish(dish: Dish) {
        return this.ddbUtil.getMapper().delete(Object.assign(new Dish(), {id: dish.id, createdAt: dish.createdAt}));
    }



}
