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

const placeholderEmail = new sst.Secret("PlaceholderEmail");

export const email = new sst.aws.Email("EmailSendingService", {
  sender: placeholderEmail.value,
});

// export const vpc = new sst.aws.Vpc("Database");

// export const database = new sst.aws.Postgres("ClientDatabase", { vpc });

const rootAdmin = new aws.cognito.UserGroup("rootAdmin", {
  userPoolId: userPool.id,
});

const admin = new aws.cognito.UserGroup("admin", {
  userPoolId: userPool.id,
});

const agent = new aws.cognito.UserGroup("agent", {
  userPoolId: userPool.id,
});

const rootUserEmail = new sst.Secret("RootUserEmail");

const rootUserPassword = new sst.Secret("RootUserPassword");

const rootAdminUser = new aws.cognito.User("rootAdminUser", {
  username: "rootadmin",
  userPoolId: userPool.id,
  attributes: {
    email: rootUserEmail.value,
    email_verified: "true",
  },
  password: rootUserPassword.value,
});

new aws.cognito.UserInGroup("rootAdminInRootAdminGroup", {
  groupName: rootAdmin.name,
  username: rootAdminUser.username,
  userPoolId: userPool.id,
});

new aws.cognito.UserInGroup("rootAdminInAdminGroup", {
  groupName: admin.name,
  username: rootAdminUser.username,
  userPoolId: userPool.id,
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
    VITE_ROOT_ADMIN_GROUP: rootAdmin.name,
    VITE_ADMIN_GROUP: admin.name,
    VITE_AGENT_GROUP: agent.name,
  },
});
