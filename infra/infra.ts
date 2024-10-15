import { Linkable } from "../.sst/platform/src/components";

export const region = new sst.Linkable("Region", {
  properties: { name: aws.getRegionOutput().name },
});

const rootUserSecrets = {
  email: new sst.Secret("RootUserEmail"),
  password: new sst.Secret("RootUserPassword"),
};

Linkable.wrap(aws.cloudwatch.LogGroup, (logGroup) => ({
  properties: { name: logGroup.name },
  include: [
    sst.aws.permission({
      actions: ["logs:DescribeLogStreams", "logs:PutLogEvents"],
      resources: [$interpolate`${logGroup.arn}:*`],
    }),
  ],
}));

Linkable.wrap(aws.cloudwatch.LogStream, (logStream) => ({
  properties: { name: logStream.name },
}));

const lambdaLogGroup = new aws.cloudwatch.LogGroup("LambdaLogGroup", {
  name: "lambda",
  retentionInDays: 0,
});

const lambdaLogStream = new aws.cloudwatch.LogStream("LambdaLogStream", {
  logGroupName: lambdaLogGroup.name,
  name: "main",
});

const communicationLogGroup = new aws.cloudwatch.LogGroup(
  "CommunicationLogGroup",
  {
    name: "communication",
    retentionInDays: 0,
  }
);

const communicationLogStream = new aws.cloudwatch.LogStream(
  "CommunicationLogStream",
  {
    logGroupName: communicationLogGroup.name,
    name: "main",
  }
);

export const loggingQueue = new sst.aws.Queue("LoggingQueue");
loggingQueue.subscribe({
  handler: "packages/functions/src/logging/logging.handler",
  link: [
    lambdaLogGroup,
    lambdaLogStream,
    communicationLogGroup,
    communicationLogStream,
    region,
  ],
});

export const email = new sst.aws.Email("Email", {
  sender: rootUserSecrets.email.value,
});

Linkable.wrap(aws.kms.Key, (kmsKey) => ({
  properties: { arn: kmsKey.arn },
  include: [
    sst.aws.permission({
      actions: ["kms:Decrypt"],
      resources: [kmsKey.arn],
    }),
  ],
}));

const kmsKey = new aws.kms.Key("EmailSenderKey");

Linkable.wrap(aws.kms.Alias, (keyAlias) => ({
  properties: { alias: keyAlias.name },
}));

const keyAlias = new aws.kms.Alias("EmailSenderKeyAlias", {
  targetKeyId: kmsKey.id,
  name: "alias/emailSenderKey",
});

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  aliases: ["email"],
  triggers: {
    customEmailSender: {
      handler: "packages/functions/src/email/emaillogging.handler",
      link: [email, kmsKey, keyAlias, loggingQueue],
    },
    kmsKey: kmsKey.arn as any,
  },
  mfa: "optional",
  softwareToken: true,
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

const rootAdminUser = new aws.cognito.User("rootAdminUser", {
  username: "2b8d14cd-c64e-4c17-93fb-3deaa439f026",
  userPoolId: userPool.id,
  attributes: {
    email_verified: "true",
    given_name: "Root",
    family_name: "Admin",
    email: rootUserSecrets.email.value,
  },
  password: rootUserSecrets.password.value,
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

const mainframeSecrets = Object.values({
  ipAddress: new sst.Secret("MainframeIpAddress"),
  username: new sst.Secret("MainframeUsername"),
  password: new sst.Secret("MainframePassword"),
});

export const transactionImportCron = new sst.aws.Cron("TransactionImportCron", {
  schedule: "rate(18 minutes)",
  job: {
    handler: "packages/functions/src/agent/crontransactions.handler",
    timeout: "15 minutes",
    link: [clientDatabase, ...mainframeSecrets],
    nodejs: {
      install: ["ssh2-sftp-client"],
    },
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
    link: [userGroups, clientDatabase, loggingQueue],
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
    link: [userGroups, clientDatabase, bucket, loggingQueue],
    handler: "packages/functions/src/agent/getclient.handler",
  },
  routeMetadata
);

api.route(
  "POST /agent/client",
  {
    link: [userGroups, clientDatabase, loggingQueue],
    handler: "packages/functions/src/agent/createclient.handler",
  },
  routeMetadata
);

api.route(
  "PUT /agent/client",
  {
    link: [userGroups, clientDatabase, loggingQueue],
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

api.route(
  "GET /agent/transactions",
  {
    link: [userGroups, clientDatabase],
    handler: "packages/functions/src/agent/gettransactions.handler",
  },
  routeMetadata
);

new sst.aws.Function("InternalNightmareApi", {
  handler: "packages/functions/src/agent/internalnightmareapi.handler",
  url: true,
  link: [clientDatabase],
});

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
