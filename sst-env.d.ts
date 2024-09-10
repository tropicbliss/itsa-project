/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    "Api": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "EmailSendingService": {
      "sender": string
      "type": "sst.aws.Email"
    }
    "Frontend": {
      "type": "sst.aws.StaticSite"
      "url": string
    }
    "IdentityPool": {
      "id": string
      "type": "sst.aws.CognitoIdentityPool"
    }
    "PlaceholderEmail": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "RootUserEmail": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "RootUserPassword": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "UserPool": {
      "id": string
      "type": "sst.aws.CognitoUserPool"
    }
    "UserPoolClient": {
      "id": string
      "secret": string
      "type": "sst.aws.CognitoUserPoolClient"
    }
  }
}
export {}
