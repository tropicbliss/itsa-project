export const region = new sst.Linkable("Region", {
  properties: { name: aws.getRegionOutput().name },
});

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  aliases: ["email"],
});

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

api.route(
  "GET /admin/users",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/getusers.handler",
  },
  {
    auth: {
      jwt: {
        authorizer: authorizer.id,
      },
    },
  }
);

api.route(
  "DELETE /admin/user",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/deleteuser.handler",
  },
  {
    auth: {
      jwt: {
        authorizer: authorizer.id,
      },
    },
  }
);

api.route(
  "POST /admin/disableuser",
  {
    link: [region, userGroups, userPool],
    handler: "packages/functions/src/disableuser.handler",
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
