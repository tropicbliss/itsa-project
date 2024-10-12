export const region = new sst.Linkable("Region", {
  properties: { name: aws.getRegionOutput().name },
});

const rootUserEmail = new sst.Secret("RootUserEmail");

const lambdaLogGroup = new aws.cloudwatch.LogGroup("LambdaLogGroup", {
  name: "lambda",
  retentionInDays: 0,
});

const communicationLogGroup = new aws.cloudwatch.LogGroup(
  "CommunicationLogGroup",
  {
    name: "communication",
    retentionInDays: 0,
  }
);

export const email = new sst.aws.Email("Email", {
  sender: rootUserEmail.value,
});

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  aliases: ["email"],
  mfa: "on",
  softwareToken: true,
  // triggers: {
  //   customEmailSender: {
  //     handler: "",
  //     logging: {
  //       format: "json",
  //       logGroup: communicationLogGroup.name,
  //     },
  //     link: [email, rootUserEmail],
  //   },
  // },
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

export const clientDatabaseVpc = new sst.aws.Vpc("DatabaseVPC");

export const clientDatabase = new sst.aws.Postgres.v1("ClientDatabase", {
  vpc: clientDatabaseVpc,
});

const mainframeIpAddress = new sst.Secret("MainframeIpAddress");

const mainframePassword = new sst.Secret("MainframePassword");

const mainframeUsername = new sst.Secret("MainframeUsername");

export const transactionImportCron = new sst.aws.Cron("TransactionImport", {
  schedule: "rate(18 minutes)",
  job: {
    handler: "packages/functions/src/agent/crontransactions.handler",
    timeout: "15 minutes",
    link: [
      clientDatabase,
      mainframeIpAddress,
      mainframePassword,
      mainframeUsername,
    ],
    logging: false,
  },
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
    logging: false,
  },
  routeMetadata
);

api.route(
  "DELETE /admin/user",
  {
    link: [region, userGroups, userPool, clientDatabase],
    handler: "packages/functions/src/admin/deleteuser.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "POST /admin/disableuser",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/disableuser.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "POST /admin/user",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/createuser.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "PUT /admin/user",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/admin/updateuser.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "DELETE /agent/client",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/deleteclient.handler",
    logging: {
      format: "json",
      logGroup: lambdaLogGroup.name,
    },
  },
  routeMetadata
);

api.route(
  "DELETE /agent/account",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/deleteaccount.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "POST /agent/account",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/createaccount.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "GET /agent/client",
  {
    link: [userGroups, clientDatabase, bucket],
    handler: "packages/functions/src/agent/getclient.handler",
    logging: {
      format: "json",
      logGroup: lambdaLogGroup.name,
    },
  },
  routeMetadata
);

api.route(
  "POST /agent/client",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/createclient.handler",
    logging: {
      format: "json",
      logGroup: lambdaLogGroup.name,
    },
  },
  routeMetadata
);

api.route(
  "PUT /agent/client",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/updateclient.handler",
    logging: {
      format: "json",
      logGroup: lambdaLogGroup.name,
    },
  },
  routeMetadata
);

api.route(
  "POST /agent/verifyclient",
  {
    link: [userGroups, clientDatabase, bucket],
    handler: "packages/functions/src/agent/verifyclient.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "GET /agent/accounts",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/getaccounts.handler",
    logging: false,
  },
  routeMetadata
);

api.route(
  "GET /agent/transactions",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/gettransactions.handler",
    logging: false,
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
