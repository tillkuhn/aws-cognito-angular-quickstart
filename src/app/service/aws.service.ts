import {Injectable} from '@angular/core';
import {Callback, CognitoUtil} from './cognito.service';
import * as AWS from 'aws-sdk/global';
import {NGXLogger} from 'ngx-logger';
import {DynamoDBService} from './ddb.service';
/**
 * Created by Vladimir Budilov
 */
@Injectable()
export class AwsUtil {
    public static firstLogin: boolean = false;
    public static runningInit: boolean = false;

    constructor(
        public cognitoUtil: CognitoUtil,
        private log: NGXLogger,
        private ddb: DynamoDBService
    ) {
        AWS.config.region = CognitoUtil._REGION;
    }

    /**
     * This is the method that needs to be called in order to init the aws global creds
     */
    initAwsService(callback: Callback, isLoggedIn: boolean, idToken: string) {

        if (AwsUtil.runningInit) {
            // Need to make sure I don't get into an infinite loop here, so need to exit if this method is running already
            this.log.warn('AwsUtil: Aborting running initAwsService()...it\'s running already.');
            // instead of aborting here, it's best to put a timer
            if (callback != null) {
                callback.callback();
                callback.callbackWithParam(null);
            }
            return;
        }

        this.log.info('AwsUtil: Running initAwsService()');
        AwsUtil.runningInit = true;

        let mythis = this;
        // First check if the user is authenticated already
        if (isLoggedIn)
            mythis.setupAWS(isLoggedIn, callback, idToken);

    }


    /**
     * Sets up the AWS global params
     *
     * @param isLoggedIn
     * @param callback
     */
    setupAWS(isLoggedIn: boolean, callback: Callback, idToken: string): void {
        this.log.info('AwsUtil: in setupAWS()');
        if (isLoggedIn) {
            this.log.info('AwsUtil: User is logged in');
            // Setup mobile analytics
            var options = {
                appId: '32673c035a0b40e99d6e1f327be0cb60',
                appTitle: 'aws-cognito-angular2-quickstart'
            };

            // TODO: The mobile Analytics client needs some work to handle Typescript. Disabling for the time being.
            // var mobileAnalyticsClient = new AMA.Manager(options);
            // mobileAnalyticsClient.submitEvents();

            this.addCognitoCredentials(idToken);

            this.log.info('AwsUtil: Retrieving the id token');

        } else {
            this.log.info('AwsUtil: User is not logged in');
        }

        if (callback != null) {
            callback.callback();
            callback.callbackWithParam(null);
        }

        AwsUtil.runningInit = false;
    }

    addCognitoCredentials(idTokenJwt: string): void {
        let creds = this.cognitoUtil.buildCognitoCreds(idTokenJwt);

        AWS.config.credentials = creds;

        creds.get((err) => {
            if (!err) {
                if (AwsUtil.firstLogin) {
                    // save the login info to DDB
                    this.ddb.writeLogEntry('login');
                    AwsUtil.firstLogin = false;
                }
            }
        });
    }

    static getCognitoParametersForIdConsolidation(idTokenJwt: string): {} {
        console.info('AwsUtil: enter getCognitoParametersForIdConsolidation()');
        let url = 'cognito-idp.' + CognitoUtil._REGION.toLowerCase() + '.amazonaws.com/' + CognitoUtil._USER_POOL_ID;
        let logins: Array<string> = [];
        logins[url] = idTokenJwt;
        let params = {
            IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID, /* required */
            Logins: logins
        };
        return params;
    }

}
