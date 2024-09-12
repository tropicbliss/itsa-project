import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  AttributeType,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function getUsersInGroup(group: string) {
  const command = new ListUsersInGroupCommand({
    GroupName: group,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(command);
  return response.Users!;
}

function extractValueInAttribute(
  attribute: AttributeType[],
  attributeName: string
) {
  return attribute.find((attribute) => attribute.Name === attributeName)!
    .Value!;
}

function getUserFromResponse(user: UserType, role: string): User {
  const attribute = user.Attributes!;
  return {
    email: extractValueInAttribute(attribute, "email"),
    firstName: extractValueInAttribute(attribute, "given_name"),
    id: user.Username!,
    lastName: extractValueInAttribute(attribute, "family_name"),
    role: role.split("-")[0],
  };
}

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ userGroup, userId }) => {
    let users: User[] = [];
    const usersInAgentRole = await getUsersInGroup(Resource.UserGroups.agent);
    for (const attribute of usersInAgentRole) {
      const user = getUserFromResponse(attribute, Resource.UserGroups.agent);
      if (user.id === userId) {
        users.push(user);
      }
    }
    if (userGroup === Resource.UserGroups.rootAdmin) {
      const usersInAdminRole = await getUsersInGroup(
        Resource.UserGroups.rootAdmin
      );
      for (const attribute of usersInAdminRole) {
        const user = getUserFromResponse(attribute, Resource.UserGroups.admin);
        if (user.id === userId) {
          users.push(user);
        }
      }
    }
    return users;
  }
);
