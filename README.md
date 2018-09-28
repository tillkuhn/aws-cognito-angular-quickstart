Yummy AWS Quickstart
===================================================
[![Build Status](https://travis-ci.org/tillkuhn/yummy-aws.svg?branch=master)](https://travis-ci.org/tillkuhn/yummy-aws)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![dependencies Status](https://david-dm.org/tillkuhn/yummy-aws/status.svg)](https://david-dm.org/tillkuhn/yummy-aws)

## Get the Code and get running quickly
```
git clone https://github.com/tillkuhn/yummy-aws.git yummy
cd yummy
npm i
```
```
# Run the app in dev mode
npm start
```

## What does this app do?

Technially this is a fork from [aws-cognito-angular-quickstart](https://github.com/awslabs/aws-cognito-angular-quickstart) based on Angular 6, AWS Cognito and Dynamo DB with a lot of additions and changes.

None technically it's an app that lets me managed recipes for my favourite dishes 🥣 🥡

![QuickStart Angular2 Cognito App](/docs/meta/Cognito-Angular2-QuickStart.png?raw=true)

## Tech Stack
### Required Tools
* [aws cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html)
* [npm](https://www.npmjs.com/)
* [angular-cli](https://github.com/angular/angular-cli)

### Frameworks
* [AWS JavaScript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/browser-intro.html)
* [Angular 2](https://angular.io/docs/ts/latest/quickstart.html)
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
terraform apply -auto-approve
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
__*NOTE: You might want to reshuffle some of the "package.json" dependencies and move the ones that belong to devDependencies 
for a leaner deployment bundle. At this point of time, AWS Beanstalk requires all of the dependencies, 
including the devDependencies to be under the dependencies section. But if you're not using Beanstalk then you can
optimize as you wish.*__

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
* https://github.com/aws-samples/aws-serverless-ember