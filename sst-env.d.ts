/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    "Api": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "Frontend": {
      "type": "sst.aws.StaticSite"
      "url": string
    }
    "IdentityPool": {
      "id": string
      "type": "sst.aws.CognitoIdentityPool"
    }
    "Region": {
      "name": string
      "type": "sst.sst.Linkable"
    }
    "RootUserEmail": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "RootUserPassword": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "UserGroups": {
      "admin": string
      "agent": string
      "rootAdmin": string
      "type": "sst.sst.Linkable"
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
