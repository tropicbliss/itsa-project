const region = aws.getRegionOutput().name

export const userPool = new sst.aws.CognitoUserPool("UserPool")

export const userPoolClient = userPool.addClient("UserPoolClient")

export const api = new sst.aws.ApiGatewayV2("Api");

export const identityPool = new sst.aws.CognitoIdentityPool("IdentityPool", {
  userPools: [
    {
      userPool: userPool.id,
      client: userPoolClient.id,
    },
  ],
  permissions: {
    authenticated: [
      {
        actions: [
          "execute-api:*",
        ],
        resources: [
          $concat(
            "arn:aws:execute-api:",
            region,
            ":",
            aws.getCallerIdentityOutput({}).accountId,
            ":",
            api.nodes.api.id,
            "/*/*/*"
          ),
        ],
      },
    ],
  },
});

const authorizer = api.addAuthorizer({
  name: "jwtAuthorizer",
  jwt: {
    issuer: $interpolate`https://cognito-idp.${region}.amazonaws.com/${userPool.id}`,
    audiences: [userPoolClient.id]
  }
})

api.route("GET /", {
  handler: "packages/functions/src/api.handler",
}, {
  auth: {
    jwt: {
      authorizer: authorizer.id
    }
  }
});