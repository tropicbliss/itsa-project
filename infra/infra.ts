const region = new sst.Linkable("Region", {
  properties: { region: aws.getRegionOutput().name }
});

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
            region.properties.region,
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

api.route("GET /", {
  link: [region],
  handler: "packages/functions/src/api.handler",
});