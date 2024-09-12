import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
  AdminDisableUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { VisibleError } from "@itsa-project/core/util/visibleError";

const schema = z.object({
  id: z.string(),
});

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function disableUser(id: string, targetGroups: string[]) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw new VisibleError("Insufficient privilege to disable user in group");
  }
  const disableCommand = new AdminDisableUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
  });
  await client.send(disableCommand);
}

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ evt, userGroup, userId }) => {
    const input = schema.parse(evt.body);
    if (input.id === userId) {
      throw new VisibleError(
        "Users cannot disable themselves via a lambda call"
      );
    }
    const allowedToDisable = [Resource.UserGroups.agent];
    if (userGroup === Resource.UserGroups.rootAdmin) {
      allowedToDisable.push(Resource.UserGroups.admin);
    }
    await disableUser(input.id, allowedToDisable);
  }
);
