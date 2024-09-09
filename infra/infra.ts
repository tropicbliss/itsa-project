const region = aws.getRegionOutput().name;

export const userPool = new sst.aws.CognitoUserPool("UserPool");

export const userPoolClient = userPool.addClient("UserPoolClient");

export const api = new sst.aws.ApiGatewayV2("Api", {
  cors: {
    allowHeaders: ["Authorization"],
  },
});

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
        actions: ["execute-api:*"],
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
    audiences: [userPoolClient.id],
  },
});

export const email = new sst.aws.Email("EmailSendingService", {
  sender: "eugenetoh54@gmail.com",
});

api.route(
  "GET /",
  {
    handler: "packages/functions/src/api.handler",
    link: [email],
  },
  {
    auth: {
      jwt: {
        authorizer: authorizer.id,
      },
    },
  }
);

export const frontend = new sst.aws.StaticSite("Frontend", {
  path: "packages/frontend",
  build: {
    output: "dist",
    command: "npm run build",
  },
  environment: {
    VITE_REGION: region,
    VITE_API_URL: api.url,
    VITE_USER_POOL_ID: userPool.id,
    VITE_IDENTITY_POOL_ID: identityPool.id,
    VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
  },
});
