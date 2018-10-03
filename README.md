Yummy Dishes & Places
===
[![Build Status](https://travis-ci.org/tillkuhn/yummy-aws.svg?branch=master)](https://travis-ci.org/tillkuhn/yummy-aws)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![dependencies Status](https://david-dm.org/tillkuhn/yummy-aws/status.svg)](https://david-dm.org/tillkuhn/yummy-aws)

## Get the Code and get running quickly
```bash
git clone https://github.com/tillkuhn/yummy-aws.git yummy
cd yummy
yarn
# Run the app in dev mode
yarn start
```

## What does this app do?

Technially this is a fork from [aws-cognito-angular-quickstart](https://github.com/awslabs/aws-cognito-angular-quickstart) based on Angular 6, AWS Cognito, DynamoDB and S3 with a lot of additions and changes.

None technically it's an app that lets me managed recipes for my favourite dishes and places I'd like to visit some day 🥣 🥡

![QuickStart Angular2 Cognito App](/docs/meta/Cognito-Angular2-QuickStart.png?raw=true)

## Tech Stack
### Required Tools
* [aws cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com)
* [angular-cli](https://github.com/angular/angular-cli)

### Frameworks
* [AWS JavaScript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/browser-intro.html)
* [Angular 6](https://angular.io/guide/quickstart)
* [TypeScript](https://www.typescriptlang.org/docs/tutorial.html)
* [Bootstrap](http://getbootstrap.com/)

## AWS Setup
##### Install the required tools)
* Create an AWS account
* Install [npm](https://www.npmjs.com/)
* [Install or update your aws cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) 
* [Install or update your eb cli](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) 
* [Install angular-cli](https://github.com/angular/angular-cli)
* [Install Terraform](https://www.terraform.io/intro/getting-started/install.html)


## Creating AWS Resources
This sample application can be deployed S3. S3 will host this application as a static site

* [What is S3](http://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)
* Run terraform to build the underlying infrastructrure

```
terraform init
terraform plan
terraform apply [-auto-approve]
```

*Caution:* You might incur AWS charges after running the setup script

## After initially running `terrfaform`, use the below commands to rebuild and redeploy

### _S3:_ Update, Build and Deploy
```
# Build the project and sync the output with the S3 bucket.
./deploy.sh
```
```
# Test your deployed application
curl –I http://[BUCKET_NAME].s3-website-[REGION].amazonaws.com/
```
## Import Data

* https://docs.aws.amazon.com/cli/latest/reference/dynamodb/put-item.html
* https://docs.aws.amazon.com/de_de/amazondynamodb/latest/developerguide/SampleData.LoadData.html

## Local Testing

This section contains instructions on how to test the application locally (using mocked services instead of the real AWS services).

### LocalStack

To test this application using [LocalStack](https://github.com/localstack/localstack), you can use the `awslocal` CLI (https://github.com/localstack/awscli-local).
```
pip install awscli-local
```

## Todos
* Admin and Editor, check out [Authorization and Cognito groups](ttps://stackoverflow.com/questions/41828359/how-do-i-access-the-group-for-a-cognito-user-account) and [fine grained access](https://aws.amazon.com/de/blogs/mobile/building-fine-grained-authorization-using-amazon-cognito-user-pools-groups/) 
* [https://www.reddit.com/r/aws/comments/808cf9/how_do_i_use_a_cognito_group_role_in_front_end/More on elevated S3 roles]()
* Try [In place edit module](https://github.com/qontu/ngx-inline-editor)
* [dish location mapbox support](https://angularfirebase.com/lessons/build-realtime-maps-in-angular-with-mapbox-gl/)https://www.flag-sprites.com/de/
* Finish S3 Integration [Example](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photo-album.html)* https://github.com/perfectline/geopoint

## Other interesting resources
* [Cognito-role-and-aws-s3-bucket-policy-for-mobile-and-web-access](https://stackoverflow.com/questions/34214240/cognito-role-and-aws-s3-bucket-policy-for-mobile-and-web-access)
* [tutorial-for-building-a-web-application-with-amazon-s3-lambda-dynamodb-and-api-gateway](https://medium.com/employbl/tutorial-for-building-a-web-application-with-amazon-s3-lambda-dynamodb-and-api-gateway-6d3ddf77f15a)
* [integrating-api-with-aws-services-s3](https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html)
* [simple/sample AngularV4-based web app that demonstrates different API authentication options using Amazon Cognito and API Gateway](https://github.com/aws-samples/aws-cognito-apigw-angular-auth)
* https://www.pluralsight.com/guides/building-a-serverless-web-app-on-aws-services