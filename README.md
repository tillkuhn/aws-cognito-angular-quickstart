Yummy Dishes & Places
===

[![Build Status](https://travis-ci.org/tillkuhn/yummy-aws.svg?branch=master)](https://travis-ci.org/tillkuhn/yummy-aws)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![dependencies Status](https://david-dm.org/tillkuhn/yummy-aws/status.svg)](https://david-dm.org/tillkuhn/yummy-aws)

## About

*Yummy Dishes & Places* is a 2-in-1 application that manages international recipes for my favourite dishes and places I'd like to visit some day 🥣 🥡

It has been forked from [aws-cognito-angular-quickstart](https://github.com/awslabs/aws-cognito-angular-quickstart) and is based on Angular 6, API Gateway, Cognito, DynamoDB and S3 and a couple of other AWS specific Services. 
You may find this project useful if you need to train for *AWS Solution Architect* or *Certified Developer* Exam, which was used to be my main motivation to play around with it.

### Preview Dishlist

![Snapshot Yummy Dishes](/docs/yummy-dishes.jpg?raw=true)

### Preview Map of Places

![Snapshot Yummy Places Map](/docs/yummy-map.jpg?raw=true)

### Preview Place Details

![Snapshot Yummy Place Details](/docs/yummy-places-details.jpg?raw=true)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Yummy Dishes & Places](#yummy-dishes--places)
  - [Get the Code and get running quickly](#get-the-code-and-get-running-quickly)
  - [What does this app do?](#what-does-this-app-do)
  - [Tech Stack](#tech-stack)
    - [Required Tools](#required-tools)
    - [Frameworks](#frameworks)
  - [AWS Setup](#aws-setup)
    - [Install the required tools)](#install-the-required-tools)
    - [Creating AWS Resources](#creating-aws-resources)
  - [_Mapbox GL_ Support](#_mapbox-gl_-support)
    - [_S3:_ Update, Build and Deploy](#_s3_-update-build-and-deploy)
  - [Import Data](#import-data)
  - [Local Testing](#local-testing)
    - [LocalStack](#localstack)
  - [Roadmap](#roadmap)
  - [Other interesting resources](#other-interesting-resources)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Get the Code and get running quickly
```bash
git clone https://github.com/tillkuhn/yummy-aws.git yummy
cd yummy    
yarn
# Run the app in dev mode
yarn start
```

## Tech Stack

![QuickStart Angular2 Cognito App](/docs/meta/Cognito-Angular2-QuickStart.png?raw=true)

### Required Tools
* Package Manager [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com)
* A recent version of [Angular CLI](https://github.com/angular/angular-cli)
* To build up AWS Infrastructure [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) and [Terraform](https://www.terraform.io/intro/getting-started/install.html)

### Frameworks
* [AWS JavaScript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/browser-intro.html)
* [Angular 6](https://angular.io/guide/quickstart)
* [TypeScript](https://www.typescriptlang.org/docs/tutorial.html)
* [Bootstrap](http://getbootstrap.com/)
* ... and many more 

## AWS Setup
### Install the required tools)
* Create an AWS account
* Install [npm](https://www.npmjs.com/)
* [Install or update your aws cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) 
* [Install or update your eb cli](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) 
* [Install angular-cli](https://github.com/angular/angular-cli)


### Creating AWS Resources
This sample application can be deployed S3. S3 will host this application as a static site

* [What is S3](http://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)
* Run terraform to build the underlying infrastructrure

```
terraform init
terraform plan
terraform apply [-auto-approve]
```

*Caution:* You might incur AWS charges after running the setup script

## _Mapbox GL_ Support

* _Yummy_ uses [Mapbox](https://www.mapbox.com/maps/) to visualize places and regions, so to use this featuere you need to register on their side and register your `mapbox_access_token`in `terraform.tfvars`

### _S3:_ Update, Build and Deploy
```
# Build the project and sync the output with the S3 bucket.
./deploy.sh
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

## Roadmap
* [Support Markdown in node fields](https://github.com/jfcere/ngx-markdown)
* Admin and Editor, check out [Authorization and Cognito groups](ttps://stackoverflow.com/questions/41828359/how-do-i-access-the-group-for-a-cognito-user-account) and [fine grained access](https://aws.amazon.com/de/blogs/mobile/building-fine-grained-authorization-using-amazon-cognito-user-pools-groups/) and [Cognito-role-and-aws-s3-bucket-policy-for-mobile-and-web-access](https://stackoverflow.com/questions/34214240/cognito-role-and-aws-s3-bucket-policy-for-mobile-and-web-access) 
* More on elevated S3 roles [How do I use a Cognito group role in front end application?](https://www.reddit.com/r/aws/comments/808cf9/how_do_i_use_a_cognito_group_role_in_front_end/) 
* Try out the [In place edit module](https://github.com/qontu/ngx-inline-editor)
* Add [Dish location mapbox support](https://angularfirebase.com/lessons/build-realtime-maps-in-angular-with-mapbox-gl/)https://www.flag-sprites.com/de/
* Improve S3 Upload Doc Integration (delete and unique filename still missing) [Example](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photo-album.html)* https://github.com/perfectline/geopoint
* Enable [Time To Live](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-how-to.html) for audit items with epoch attribute and

## Other useful resources
* [Nice collection of icons in PNG/SVG format](https://material.io/tools/icons/?icon=beach_access&style=baseline)* [tutorial-for-building-a-web-application-with-amazon-s3-lambda-dynamodb-and-api-gateway](https://medium.com/employbl/tutorial-for-building-a-web-application-with-amazon-s3-lambda-dynamodb-and-api-gateway-6d3ddf77f15a) and [Creating a serverless API using AWS API Gateway and DynamoDB](https://sanderknape.com/2017/10/creating-a-serverless-api-using-aws-api-gateway-and-dynamodb/)
* [integrating-api-with-aws-services-s3](https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html)
* [Easily add an OPTIONS method to an API Gateway resource to enable CORS (Terraform)](https://github.com/squidfunk/terraform-aws-api-gateway-enable-cors)
* [Simple/sample AngularV4-based web app that demonstrates different API authentication options using Amazon Cognito and API Gateway inc AWS CLI User setup](https://github.com/aws-samples/aws-cognito-apigw-angular-auth)
* [Secure API Access with Amazon Cognito Federated Identities, Amazon Cognito User Pools, and Amazon API Gateway](https://aws.amazon.com/de/blogs/compute/secure-api-access-with-amazon-cognito-federated-identities-amazon-cognito-user-pools-and-amazon-api-gateway/)
* [Serverless website using Angular, AWS S3, Lambda, DynamoDB and API Gateway](http://www.carbonrider.com/2018/05/11/serverless-website-using-angular-aws-s3-lambda-dynamodb-and-api-gateway/)
* [Resizing Images in the Browser in Angular With ng2-img-max](https://alligator.io/angular/resizing-images-in-browser-ng2-img-max/)
* [AWS API Gateway and Lambda to return image data](https://stackoverflow.com/questions/35804042/aws-api-gateway-and-lambda-to-return-image) and [Image Upload and Retrieval from S3 Using AWS API Gateway and Lambda](https://medium.com/think-serverless/image-upload-and-retrieval-from-s3-using-aws-api-gateway-and-lambda-b4c2961e8d1)
* [Bike and other icons for custom map markers depending on location type](https://icons8.com/icon/set/bike/windows)
* https://docs.aws.amazon.com/codepipeline/latest/userguide/tutorials-cloudwatch-sns-notifications.htmlhttps://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-how-to.html
* https://aws.amazon.com/de/blogs/aws/new-amazon-cognito-groups-and-fine-grained-role-based-access-control-2/
* https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html return and log TOTALs 
* https://stackoverflow.com/questions/37266269/aws-lambda-how-to-store-an-image-retrieved-via-https-in-s3
* https://github.com/aws-samples/aws-serverless-workshops/tree/master/ImageProcessing 
* https://medium.com/think-serverless/image-upload-and-retrieval-from-s3-using-aws-api-gateway-and-lambda-b4c2961e8d1
* [HashiCorp Serverless Applications with AWS Lambda and API Gateway](https://learn.hashicorp.com/terraform/aws/lambda-api-gateway)
