import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function getUserGroups(username: string) {
  const command = new AdminListGroupsForUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: username,
  });
  const response = await client.send(command);
  return response.Groups || [];
}

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async (event) => {
    const command = new ListUsersCommand({
      UserPoolId: Resource.UserPool.id,
    });
    const response = await client.send(command);
    const users = response.Users!;
    const usersWithGroups = await Promise.all(
      users.map(async (user) => {
        const userGroups = await getUserGroups(user.Username!);
        return {
          email: user.Username,
          firstName: user.Attributes?.find((val) => val.Name === "given_name")
            ?.Value,
          lastName: user.Attributes?.find((val) => val.Name === "family_name")
            ?.Value,
          id: user.Attributes?.find((val) => val.Name === "sub")?.Value,
          userGroups: userGroups.map((userGroup) => userGroup.GroupName),
        };
      })
    );
    return usersWithGroups;
  }
);
