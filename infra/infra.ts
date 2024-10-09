export const region = new sst.Linkable("Region", {
  properties: { name: aws.getRegionOutput().name },
});

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  aliases: ["email"],
});

export const transactionDB = new sst.aws.Dynamo("Transactions", {
  fields: {
    id: "string",
  },
  primaryIndex: {
    hashKey: "id",
  },
});

export const userPoolClient = userPool.addClient("UserPoolClient");

export const api = new sst.aws.ApiGatewayV2("Api", {
  cors: {
    allowHeaders: ["Authorization", "Content-Type"],
  },
});

export const bucket = new sst.aws.Bucket("Uploads");

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
            region.properties.name,
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
    issuer: $interpolate`https://cognito-idp.${region.properties.name}.amazonaws.com/${userPool.id}`,
    audiences: [userPoolClient.id],
  },
});

const rootAdmin = new aws.cognito.UserGroup("rootAdmin", {
  userPoolId: userPool.id,
});

const admin = new aws.cognito.UserGroup("admin", {
  userPoolId: userPool.id,
});

const agent = new aws.cognito.UserGroup("agent", {
  userPoolId: userPool.id,
});

export const userGroups = new sst.Linkable("UserGroups", {
  properties: {
    rootAdmin: rootAdmin.name,
    admin: admin.name,
    agent: agent.name,
  },
});

const rootUserEmail = new sst.Secret("RootUserEmail");

const rootUserPassword = new sst.Secret("RootUserPassword");

const rootAdminUser = new aws.cognito.User("rootAdminUser", {
  username: "rootadmin",
  userPoolId: userPool.id,
  attributes: {
    email_verified: "true",
    given_name: "Root",
    family_name: "Admin",
    email: rootUserEmail.value,
  },
  password: rootUserPassword.value,
});

new aws.cognito.UserInGroup("rootAdminInRootAdminGroup", {
  groupName: rootAdmin.name,
  username: rootAdminUser.username,
  userPoolId: userPool.id,
});

const databaseVpc = new sst.aws.Vpc("DatabaseVPC");

const clientDatabase = new sst.aws.Postgres("ClientDatabase", {
  vpc: databaseVpc,
});

const routeMetadata = {
  auth: {
    jwt: {
      authorizer: authorizer.id,
    },
  },
};

api.route(
  "GET /admin/users",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/getusers.handler",
  },
  routeMetadata
);

api.route(
  "DELETE /admin/user",
  {
    link: [region, userGroups, userPool, clientDatabase],
    handler: "packages/functions/src/admin/deleteuser.handler",
  },
  routeMetadata
);

api.route(
  "POST /admin/disableuser",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/disableuser.handler",
  },
  routeMetadata
);

api.route(
  "POST /admin/user",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/createuser.handler",
  },
  routeMetadata
);

api.route(
  "PUT /admin/user",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/updateuser.handler",
  },
  routeMetadata
);

api.route(
  "DELETE /agent/client",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/deleteclient.handler",
  },
  routeMetadata
);

api.route(
  "DELETE /agent/account",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/deleteaccount.handler",
  },
  routeMetadata
);

api.route(
  "POST /agent/account",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/createaccount.handler",
  },
  routeMetadata
);

api.route(
  "GET /agent/client",
  {
    link: [userGroups, clientDatabase, bucket],
    handler: "packages/functions/src/agent/getclient.handler",
  },
  routeMetadata
);

api.route(
  "POST /agent/client",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/createclient.handler",
  },
  routeMetadata
);

api.route(
  "PUT /agent/client",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/updateclient.handler",
  },
  routeMetadata
);

api.route(
  "POST /agent/verifyclient",
  {
    link: [userGroups, clientDatabase, bucket],
    handler: "packages/functions/src/agent/verifyclient.handler",
  },
  routeMetadata
);

api.route(
  "GET /agent/accounts",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/getaccounts.handler",
  },
  routeMetadata
);

export const frontend = new sst.aws.StaticSite("Frontend", {
  path: "packages/frontend",
  build: {
    output: "dist",
    command: "npm run build",
  },
  environment: {
    VITE_REGION: region.properties.name,
    VITE_API_URL: api.url,
    VITE_USER_POOL_ID: userPool.id,
    VITE_IDENTITY_POOL_ID: identityPool.id,
    VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
    VITE_ROOT_ADMIN_GROUP: rootAdmin.name,
    VITE_ADMIN_GROUP: admin.name,
    VITE_AGENT_GROUP: agent.name,
  },
});
