import {Injectable} from '@angular/core';
import * as AWS from 'aws-sdk/global';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {DataMapper} from '@aws/dynamodb-data-mapper';
import {NGXLogger} from 'ngx-logger';

import {CognitoUtil} from './cognito.service';
import {environment} from '../../environments/environment';
import {Stuff} from '../secure/useractivity/useractivity.component';

/**
 * Created by Vladimir Budilov
 */

/* Helper */
@Injectable()
export class DynamoDBUtil {
    getMapper() {
        return new DataMapper({
            client: new DynamoDB(this.getClientParams()), // the SDK client used to execute operations
            // optionally, you can provide a table prefix to keep your dev and prod tables separate
            tableNamePrefix: environment.ddbTableNamePrefix + '-'
        });
    }

    getClientParams(): DynamoDB.Types.ClientConfiguration {
        let clientParams: any = {};
        if (environment.dynamodb_endpoint) {
            clientParams.endpoint = environment.dynamodb_endpoint;
        }
        clientParams.region = environment.region;
        return clientParams;
    }

    getTableName(suffix: string) {
        return environment.ddbTableNamePrefix + '-' + suffix;
    }

}

@Injectable()
export class DynamoDBService {

    constructor(
        public cognitoUtil: CognitoUtil,
        private ddbUtil: DynamoDBUtil,
        private log: NGXLogger) {
    }

    getAWS() {
        return AWS;
    }

    getLogEntries(mapArray: Array<Stuff>) {
        this.log.info('DynamoDBService: reading from DDB with creds - ' + AWS.config.credentials);
        let params = {
            TableName: this.ddbUtil.getTableName('logintrail'),
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': this.cognitoUtil.getCognitoIdentity()
            }
        };

        let docClient = new DynamoDB.DocumentClient(this.ddbUtil.getClientParams());
        docClient.query(params, (err, data) => {
            if (err) {
                this.log.error('DynamoDBService: Unable to query the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                // print all the movies
                this.log.info('DynamoDBService: Query succeeded.');
                data.Items.forEach(function (logitem) {
                    mapArray.push({type: logitem.type, date: logitem.activityDate});
                });
            }
        });
    }

    writeLogEntry(type: string) {
        try {
            let date = new Date().toString();
            this.log.info('DynamoDBService: Writing log entry. Type:' + type + ' ID: '
                + this.cognitoUtil.getCognitoIdentity() + ' Date: ' + date);
            this.write(this.cognitoUtil.getCognitoIdentity(), date, type);
        } catch (exc) {
            this.log.error('DynamoDBService: Couldn\'t write to DDB');
        }

    }

    write(data: string, date: string, type: string): void {
        console.log('DynamoDBService: writing ' + type + ' entry');

        let clientParams: any = {
            params: {TableName: this.ddbUtil.getTableName('logintrail')}
        };
       let DDB = new DynamoDB(this.ddbUtil.getClientParams());

        // Write the item to the table
        let itemParams =
            {
                TableName: environment.ddbTableName,
                Item: {
                    userId: {S: data},
                    activityDate: {S: date},
                    type: {S: type}
                }
            };
        DDB.putItem(itemParams, function (result) {
            this.log.info('DynamoDBService: wrote entry: ' + JSON.stringify(result));
        });
    }

}


